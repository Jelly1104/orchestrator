# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
| 항목 | 구현 방식 | 파일 위치 |
|------|----------|-----------|
| Hello World API | Express.js GET /api/hello 엔드포인트 | `/api/hello.js` |
| 프론트엔드 UI | React 컴포넌트 기반 SPA | `/pages/index.tsx` |
| API 테스트 기능 | 버튼 클릭으로 API 호출 | `/components/ApiTestButton.tsx` |
| 응답 표시 영역 | 동적 응답 결과 렌더링 | `/components/ResponseDisplay.tsx` |

## Mode
**Coding**

## Required Outputs
1. **백엔드 API**
   - `GET /api/hello` 엔드포인트 구현
   - JSON 응답 (message, timestamp, version)
   - Express.js 서버 설정

2. **프론트엔드 UI**
   - 홈 페이지 (`pages/index.tsx`)
   - API 테스트 버튼 컴포넌트
   - 응답 표시 컴포넌트
   - 기본 CSS 스타일링

3. **설정 파일**
   - `package.json` (의존성 관리)
   - Next.js 설정 (필요시)
   - TypeScript 설정 (타입 정의)

## Input Documents
- IA.md (라우팅 구조 참조)
- Wireframe.md (UI 레이아웃 참조)
- SDD.md (API 스펙 및 컴포넌트 인터페이스 참조)

## Completion Criteria
✅ **기능적 요구사항**
- [ ] `/api/hello` API가 정상 응답 (200 OK)
- [ ] API 응답에 message, timestamp, version 포함
- [ ] 홈 페이지에서 Hello World 메시지 표시
- [ ] API 호출 버튼 클릭 시 응답 표시
- [ ] 로딩 상태 및 에러 처리 구현

✅ **기술적 요구사항**
- [ ] TypeScript 타입 정의 완료
- [ ] 반응형 디자인 적용
- [ ] 코드 가독성 및 주석 작성
- [ ] 기본적인 에러 핸들링

✅ **테스트 요구사항**
- [ ] API 엔드포인트 수동 테스트 가능
- [ ] 브라우저에서 UI 정상 작동 확인
- [ ] 다양한 화면 크기에서 레이아웃 검증

## Constraints
- **기술 스택**: Next.js + TypeScript (프론트엔드), Express.js (백엔드)
- **외부 의존성 최소화**: 필수 라이브러리만 사용
- **개발 시간**: 단순 구현이므로 빠른 프로토타이핑 우선
- **데이터베이스 불필요**: 정적 응답으로 충분
- **인증 불필요**: 공개 API로 구현

## Special Notes
- 이 프로젝트는 기본적인 API-UI 연동 패턴을 확인하는 용도
- 향후 복잡한 기능 추가 시 확장 가능한 구조로 설계
- 코드 품질보다는 빠른 동작 확인이 우선순위
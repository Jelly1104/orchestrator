# HANDOFF.md - Sub-agent 작업 지시서

## PRD 산출물 체크리스트 매핑
| 요구사항 | 구현 방식 |
|---------|----------|
| 할 일 추가 기능 | TodoInput 컴포넌트 + addTodo 함수 |
| 할 일 삭제 기능 | TodoItem 컴포넌트의 Delete 버튼 + deleteTodo 함수 |
| 할 일 목록 표시 | TodoList 컴포넌트 + map 렌더링 |

## Mode
Coding

## Required Outputs
1. **App.js** - 메인 컨테이너 컴포넌트 (상태 관리)
2. **TodoInput.js** - 할 일 입력 컴포넌트
3. **TodoList.js** - 할 일 목록 컴포넌트  
4. **TodoItem.js** - 개별 할 일 항목 컴포넌트
5. **App.css** - 기본 스타일링
6. **index.js** - React 앱 엔트리 포인트
7. **package.json** - 의존성 정의

## Input Documents
- IA.md - 정보 구조 참조
- Wireframe.md - UI 레이아웃 참조  
- SDD.md - 컴포넌트 설계 참조

## Completion Criteria
- [ ] 텍스트 입력 후 "추가" 버튼 클릭 시 목록에 새 할 일 추가됨
- [ ] 각 할 일 항목의 "삭제" 버튼 클릭 시 목록에서 제거됨
- [ ] 입력창은 할 일 추가 후 자동으로 비워짐
- [ ] 반응형 레이아웃 적용 (모바일/데스크톱)
- [ ] 빈 입력값으로는 할 일 추가 불가
- [ ] 브라우저에서 정상 실행 가능

## Constraints
- React 함수형 컴포넌트 + Hooks 사용
- 외부 라이브러리 최소화 (React, ReactDOM만)
- 서버 연동 없음 (로컬 상태만)
- 데이터 영속성 없음 (새로고침 시 초기화)
- ES6+ 문법 사용
- 접근성 고려 (키보드 네비게이션, aria-label)

## Implementation Notes
- useState Hook으로 todos 배열과 inputValue 관리
- map()을 사용한 리스트 렌더링
- key prop으로 todo.id 사용
- Enter키 입력 시에도 할 일 추가 가능하도록 구현
- 삭제 시 확인 없이 즉시 삭제
# IA.md - 정보 구조 설계

## 1. 전체 시스템 구조

### 1.1 메인 네비게이션
```
오케스트레이터 통합 검증 대시보드
├── Phase A: 정량적 분석
│   ├── 활성 회원 세그먼트
│   ├── 전문과목별 분포
│   ├── 로그인 패턴 분석
│   └── 분석 결과 요약
├── Phase B: 설계 문서
│   ├── IA 구조 검증
│   ├── Wireframe 검증
│   ├── SDD 검증
│   └── HANDOFF 검증
├── Phase C: 코드 구현
│   ├── API 엔드포인트
│   ├── React 컴포넌트
│   ├── 테스트 코드
│   └── 빌드 검증
└── 통합 모니터링
    ├── 파이프라인 상태
    ├── HITL 체크포인트
    ├── 성능 지표
    └── 에러 로그
```

### 1.2 라우팅 구조
```
/orchestrator-validation/
├── /analysis           # Phase A
├── /design            # Phase B
├── /implementation    # Phase C
├── /monitoring        # 통합 모니터링
└── /reports          # 검증 결과 리포트
```

### 1.3 페이지별 정보 계층

#### Phase A: 분석 대시보드
- **Level 1**: 요약 KPI 카드
- **Level 2**: 세그먼트 분포 차트
- **Level 3**: 상세 데이터 테이블
- **Level 4**: 필터 및 설정

#### Phase B: 설계 검증
- **Level 1**: 문서 상태 개요
- **Level 2**: 각 문서별 상세 내용
- **Level 3**: 검증 체크리스트
- **Level 4**: 피드백 및 수정사항

#### Phase C: 구현 검증
- **Level 1**: 빌드 상태 요약
- **Level 2**: 코드 품질 지표
- **Level 3**: 테스트 커버리지 세부사항
- **Level 4**: 개별 파일 상태
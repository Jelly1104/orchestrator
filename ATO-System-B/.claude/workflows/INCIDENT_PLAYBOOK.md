# INCIDENT_PLAYBOOK.md

> **버전**: 1.2.4

> **최종 수정**: 2025-12-23

> **변경 이력**: 섹션 참조 이름 기반으로 전환 (SYSTEM_MANIFEST 9.2 준수)

> **물리적 경로**: `.claude/workflows/INCIDENT_PLAYBOOK.md`

> **상위 문서**: `.claude/CLAUDE.md`

> **목적**: Orchestrator 장애 대응 절차

> **대상**: 운영자 (Human)

---

## 장애 분류

### 심각도 레벨

| 레벨   | 설명             | 예시                          | 대응 시간   |
| ------ | ---------------- | ----------------------------- | ----------- |
| **P0** | 서비스 전면 중단 | API 키 만료, DB 연결 실패     | 즉시        |
| **P1** | 핵심 기능 장애   | 파이프라인 실패, Role 무응답  | 30분 이내   |
| **P2** | 부분 기능 장애   | 특정 Role 오류, 느린 응답     | 2시간 이내  |
| **P3** | 경미한 이슈      | UI 버그, 로그 누락            | 24시간 이내 |

---

## 장애 시나리오별 대응

### P0: API 키 만료/무효

**증상**:

```
Error: 401 Unauthorized
Error: Invalid API key
```

**대응 절차**:

1. `.env` 파일 확인
2. API 키 유효성 검증 (Provider 대시보드)
3. 새 키 발급 및 교체
4. 서비스 재시작

```bash
# 키 확인
cat .env | grep API_KEY

# 서비스 재시작
pm2 restart orchestrator
```

### P0: DB 연결 실패

**증상**:

```
Error: ECONNREFUSED
Error: Access denied for user
```

**대응 절차**:

1. DB 서버 상태 확인
2. 네트워크 연결 확인
3. 인증 정보 검증
4. 방화벽/보안그룹 확인

```bash
# 연결 테스트
mysql -h HOST -P 3306 -u USER -p -e "SELECT 1"

# 네트워크 확인
ping DB_HOST
telnet DB_HOST 3306
```

### P1: LLM Provider 장애

**증상**:

```
Error: 503 Service Unavailable
Error: Rate limit exceeded
```

**대응 절차**:

1. Provider 상태 페이지 확인
2. Fallback Provider 자동 전환 확인
3. 수동 Fallback 전환 (필요 시)

```javascript
// config/feature-flags.js에서 Provider 변경
{
  "llm": {
    "provider": "openai",  // anthropic → openai
    "fallbackOrder": ["openai", "gemini", "anthropic"]
  }
}
```

**Provider 상태 페이지**:

- Anthropic: https://status.anthropic.com
- OpenAI: https://status.openai.com
- Google AI: https://status.cloud.google.com

### P1: Role 무한 루프

> **HITL 참조**: Role 3회 연속 Review FAIL 시 **Human-in-the-Loop 수동 수정** 체크포인트가 트리거됩니다.
> 상세 정의는 `ROLE_ARCHITECTURE.md`의 **HITL 체크포인트** 섹션을 참조하세요.

**증상**:

- 토큰 사용량 급증
- 동일 단계 반복
- 응답 시간 초과

**대응 절차**:

1. 실행 중인 태스크 강제 종료
2. 로그 분석으로 원인 파악
3. maxRetries 제한 확인 (하드코딩: 5회)

```bash
# 실행 중인 프로세스 확인
ps aux | grep orchestrator

# 강제 종료
kill -9 PID

# 로그 확인
tail -f orchestrator/logs/.running.json
```

### P1: 토큰 한도 초과

**증상**:

```
Error: Token limit exceeded
Error: Context length exceeded
```

**대응 절차**:

1. 입력 PRD 크기 확인 (최대 50KB, .claude/project/PRD.md)
2. 요청 분할 처리
3. 토큰 사용량 리포트 생성

```bash
# PRD 크기 확인
wc -c .claude/project/PRD.md

# 토큰 사용량 확인
cat orchestrator/logs/TASK_ID.json | jq '.totalTokens'
```

### P2: Viewer 연결 실패

**증상**:

- WebSocket 연결 끊김
- 실시간 업데이트 중단

**대응 절차**:

1. Viewer 서버 상태 확인
2. 포트 충돌 확인 (3000)
3. 서버 재시작

```bash
# 포트 확인
lsof -i :3000

# 서버 재시작
node orchestrator/viewer/server.js
```

---

## 복구 절차

### 서비스 재시작

```bash
# 1. 현재 상태 확인
node orchestrator/healthcheck.js

# 2. 프로세스 정리
pkill -f "node orchestrator"

# 3. 서비스 시작
node orchestrator/index.js

# 4. Viewer 시작 (별도 터미널)
node orchestrator/viewer/server.js
```

### 데이터 복구

```bash
# 로그 백업
cp -r orchestrator/logs orchestrator/logs.backup.$(date +%Y%m%d)

# HITL 대기열 초기화 (필요 시)
rm orchestrator/logs/.hitl/*.json

# 실행 중 상태 초기화
rm orchestrator/logs/.running.json
```

### 롤백

```bash
# 이전 버전으로 롤백
git log --oneline -5
git checkout <COMMIT_HASH>

# 의존성 재설치
npm install
```

---

## 모니터링 지표

### 핵심 메트릭

| 메트릭      | 정상 범위 | 경고 임계값 | 위험 임계값   |
| ----------- | --------- | ----------- | ------------- |
| 응답 시간   | < 5s      | > 10s       | > 30s         |
| 토큰/요청   | < 10K     | > 30K       | > 50K         |
| 재시도 횟수 | 0-1       | 3           | 5 (하드 리밋) |
| 성공률      | > 95%     | < 90%       | < 80%         |

### 로그 위치

```text
orchestrator/logs/
├── TASK_ID.json      # [Main] 실행 메트릭 및 결과
├── .running.json     # [State] 현재 실행 중인 프로세스 상태
├── .hitl/            # [Queue] Human-in-the-Loop 승인 대기열
├── .rerun/           # [Action] 재실행 요청 트리거
└── audit/            # [Security] 보안 감사 로그 (PII 마스킹됨)
```

---

## 에스컬레이션

### 에스컬레이션 경로

```
P3 → 담당 개발자 (Slack)
P2 → 팀 리드 (Slack + Email)
P1 → 팀 리드 + PO (Slack + Phone)
P0 → 전체 팀 + CTO (즉시 회의)
```

### 연락처

| 역할      | 담당자 | 연락처    |
| --------- | ------ | --------- |
| 개발 리드 | TBD    | @dev-lead |
| PO        | TBD    | @po       |
| 인프라    | TBD    | @infra    |

---

## 체크리스트

### 장애 발생 시

- [ ] 증상 확인 및 심각도 분류 → 타임라인 기록 시작
- [ ] 영향 범위 파악 → 에스컬레이션 (필요 시)
- [ ] 복구 작업 수행 → 복구 확인 → 사후 분석 작성

### 일일 점검

- [ ] API 키/DB 연결/로그 디스크 용량/실행 중 태스크 확인

### Post-Mortem 필수 항목

| 항목        | 내용                                     |
| ----------- | ---------------------------------------- |
| 개요        | 발생/복구 시간, 영향 범위, 심각도        |
| 타임라인    | 감지 → 대응 → 파악 → 복구                |
| 원인/방지책 | 근본 원인, Action Items (단기/중기/장기) |

---

## 관련 문서

| 문서                    | 역할                             |
| ----------------------- | -------------------------------- |
| CLAUDE.md               | 최상위 헌법 및 안전 수칙         |
| ERROR_HANDLING_GUIDE.md | **AI Role 오동작 대응 절차**     |
| ROLE_ARCHITECTURE.md    | HITL 체크포인트 섹션             |
| DB_ACCESS_POLICY.md     | DB 접근 권한 및 제약 사항        |
| HANDOFF_PROTOCOL.md     | Circuit Breaker 정책 (재시도 5회) |

**END OF PLAYBOOK**

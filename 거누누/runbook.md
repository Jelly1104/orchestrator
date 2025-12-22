# Runbook — Global Saju Ops

## 0) 원칙
- PII(생년월일/출생시간/원본 입력)는 로그/에러에 남기지 않는다.
- 결제/웹훅/잡은 **멱등**이어야 한다.
- 장애 시 최우선은 “출혈 중단” (JOBS_ENABLED=false)

## 1) 필수 환경변수
- DB URL (DATABASE_URL 또는 POSTGRES_* 계열, 자세한 목록은 `docs/ops-env.md`)
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- APP_BASE_URL (Checkout redirect URL 생성용, 스테이징/프로덕션 권장)
- CRON_SECRET (RUNNER_AUTH_MODE=header일 때 필요)
- RUNNER_AUTH_MODE (header | none)
- ADMIN_SECRET
- JOBS_ENABLED ("true"일 때만 runner 실행)
- JOB_LOCK_TTL_MINUTES (default 15)
- REPORT_STORAGE_PROVIDER (local | vercel_blob)
- (Vercel Blob) BLOB_READ_WRITE_TOKEN

## 2) 관측/알림 포인트
- Webhook 실패율 증가(WebhookEvent FAILED)
- ReportJob FAILED 급증
- ReportJob RUNNING stale 증가(lockedAt TTL 초과)
- PDF 생성 지연(p95) 증가
- ReportCost 급증(원가 폭증)

## 3) 결제(Webhook) 장애 대응

### 3.1 증상
- 결제는 되었는데 리포트가 생성되지 않음(PENDING 없음)
- 결제는 되었는데 PDF가 없음(READY 전환 실패)
- webhook 400/500 증가

### 3.2 즉시 확인
- WebhookEvent: FAILED/RECEIVED 누적 여부 확인
- 특정 eventId 반복 유입 여부 확인(중복 전송 흔함)

### 3.3 안전한 재처리 원칙
- WebhookEvent가 PROCESSED면 동일 eventId는 다시 처리하지 않는다.
- Purchase는 idempotencyKey unique upsert로 중복 생성 방지
- ReportJob은 reportId+jobType 중복 enqueue 방지

### 3.4 조치
1) signature 실패(400)라면 STRIPE_WEBHOOK_SECRET 확인
2) 처리 로직 실패(FAILED)라면 lastError 확인
3) 수정 후에는:
   - 동일 eventId는 멱등으로 안전(중복 생성 X)
   - 필요 시 운영자용 재처리 도구가 있으면 사용(없으면 개발 추가)

### 3.5 Checkout(결제 시작) 장애 포인트
- `/api/checkout/create`가 실패하는 경우:
  - `pricing` Config가 없거나(미시드/미배포)
  - Stripe priceId가 placeholder이거나(실제 priceId로 교체 필요)
  - `STRIPE_SECRET_KEY` 누락

참고: 스테이징/배포 절차는 `docs/deploy-guide.md`를 따른다.

## 4) Report/PDF Job 장애 대응

### 4.1 증상
- Report.status=PENDING에 오래 머무름
- ReportJob FAILED 다수
- 다운로드 불가

### 4.2 즉시 조치
- /admin/jobs에서 FAILED 확인 → Requeue
- lastError 기준으로 원인 분류:
  - PDF 엔진 오류(렌더/폰트/한글)
  - Storage 쓰기 실패(권한/경로/스토리지 설정)
  - 템플릿 렌더 깨짐

Vercel 서버리스 주의:
- 로컬 파일(`apps/web/public`)은 영구 보관에 부적합/쓰기 제한이 있을 수 있어 `REPORT_STORAGE_PROVIDER=vercel_blob` 권장

### 4.3 재시도 정책
- attempts < maxAttempts: exponential backoff 후 QUEUED 재시도
- maxAttempts 도달: FAILED 확정(수동 개입)

## 5) 스턱(RUNNING) 잡 복구(LOCK_TTL)

### 5.1 정의
- ReportJob.status=RUNNING 이고 lockedAt이 TTL(JOB_LOCK_TTL_MINUTES)보다 오래되면 stale

### 5.2 복구 절차
1) Report가 READY인지 확인
   - READY면 job은 SUCCEEDED로 “정리”(중복 실행 금지)
2) Report가 PENDING이면
   - stale job을 QUEUED로 되돌리거나(Unlock)
   - 러너가 stale RUNNING을 회수하여 재실행하도록 처리

### 5.3 운영자 조치
- /admin/jobs에서 STALE_RUNNING 필터 확인
- “Unlock stale RUNNING” 실행
  - READY report는 job SUCCEEDED 처리
  - PENDING report는 QUEUED로 되돌림(nextRunAt=now)

## 6) 비상 정지(Emergency Stop)

### 언제?
- PDF 실패율 급증 / 원가 급증 / 스토리지 장애 등 연쇄 실패

### 절차
1) JOBS_ENABLED=false 적용
2) Cron은 계속 호출해도 runner는 no-op (추가 피해 방지)
3) 원인 해결 후 JOBS_ENABLED=true 복구
4) /admin/jobs에서 FAILED부터 순차 Requeue

## 7) 비용(원가) 급증 대응
- ReportCost 기간별 집계
- 원가 상한 정책(추후 추가):
  - 특정 기간 또는 건당 비용이 임계치 초과 시 잡 생성/실행 차단 + 알림

## 8) DB 백업/복구
- 정기 백업 + 월 1회 복구 리허설 권장
- 복구 후 점검:
  - purchases/reports 정합성(결제 성공인데 리포트 없는 건 없는지)
  - webhook 재처리 필요 여부 판단(멱등 기반)

## 9) 키 회전 체크리스트
- STRIPE_SECRET_KEY 교체
- STRIPE_WEBHOOK_SECRET 교체
- CRON_SECRET 교체
- ADMIN_SECRET 교체
- 교체 후 검증:
  - webhook 서명 검증 통과 여부
  - runner 인증 호출 성공 여부
  - admin endpoint 인증 성공 여부

## 10) 개발/로컬 트러블슈팅

### 10.1 `vendor-chunks/next.js` ENOENT (Next dev/build 출력 깨짐)
증상:
- `ENOENT: no such file or directory, open .../.next/server/vendor-chunks/next.js`
- (dev 분리 후) `ENOENT: .../.next-dev/server/vendor-chunks/next.js`

원인(대개):
- `next dev`/`next build`가 중간에 중단되어 `.next`가 불완전한 상태로 남음
- 동일 디렉토리에서 Next 프로세스를 여러 개 동시에 띄워 `.next` 출력이 경쟁 상태가 됨

조치:
1) 실행 중인 Next 프로세스를 종료
2) `.next`/`.next-dev`를 삭제 후 재시작
   - `npm run dev:web` (자동으로 `.next` 정리 후 dev 실행)
   - 또는 `npm run build:web` 후 `npm run start:web`

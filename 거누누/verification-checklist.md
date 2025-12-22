# Verification Checklist — Global Saju (Production)

목표: **결제 웹훅 멱등성 + DB 잡큐 + TTL(스턱) 복구 + 비용 가드레일 + Admin Ops**가 운영 환경에서 안전하게 동작하는지 검증한다.

> 원칙: PII(생년월일/출생시간/출생지 등)는 로그/에러에 남기지 않는다.  
> 명령어는 `npx` 대신 `npm exec` 사용.

---

## 동기화 상태(코드/테스트)
- [x] 스키마/마이그레이션: `Config`, `WebhookEvent`, `Purchase`, `Report`, `ReportJob`, `ReportCost` 구현
- [x] Prisma 연결: `prisma+postgres://`(accelerateUrl) + `postgresql://`(Driver Adapter: `@prisma/adapter-pg`) 지원
- [x] 웹훅 처리 로직 + 멱등 유닛테스트(무DB): `packages/db/webhooks/stripeWebhookProcessor.test.ts`
- [x] 러너 핵심 로직 유닛테스트(무DB): `packages/report/jobProcessor.test.ts`
- [x] 데모(무DB) 기본 페이지/헬스체크: `/` + `/api/health`
- [x] 프론트 골격(무DB): `/input`(세션 저장), `/result`, `/paywall`, `/me/reports`, `/legal/*`
- [x] PII 보호(데모): 입력값을 URL에 넣지 않고 `sessionStorage`에만 저장
- [x] 샘플 PDF(무DB): `/api/demo/sample-report?locale=ko-KR|en-US`
- [x] 랜딩 전환 구조(신뢰/가치/FAQ/CTA): `apps/web/app/page.tsx`
- [x] Checkout 세션 생성 + Paywall 연결: `POST /api/checkout/create` (DB `pricing` 기반)
- [x] 결제 세션 기반 리포트 조회(운영): `GET /api/reports/by-session?sessionId=...` + `/me/reports`
- [x] PDF 스토리지: 로컬 + Vercel Blob (`REPORT_STORAGE_PROVIDER`로 전환)
- [x] 배포/스테이징 가이드: `docs/deploy-guide.md`
- [ ] DB 환경에서 `migrate deploy` + `db seed` 실제 실행 검증
- [ ] 스테이징에서 Stripe 재전송/중복 전송(E2E) 검증
- [ ] 크론으로 runner 주기 호출(E2E) 검증

---

## 0) 빠른 확인(코드/구성)
- [x] Prisma 스키마 경로가 `./prisma/schema.prisma` 인가?
- [x] DB URL이 `prisma+postgres://`면 accelerateUrl, `postgresql://`면 adapter 기반으로 PrismaClient가 생성되는가? (`packages/db/prisma.ts:1`)
- [x] Prisma CLI가 `POSTGRES_URL_NON_POOLING` 등 Vercel Postgres env를 인식하는가? (`prisma.config.ts:1`)
- [x] `ReportCost`가 아래 조건을 정확히 만족하는가?
  - [x] 필드: `reportId String`, `jobId String`, `costType String`, `amount Int`, `currency String @default("KRW")`, `metaJson Json?`, `createdAt DateTime @default(now())`
  - [x] `@@unique([jobId, costType])`
  - [x] `@@index([reportId])`, `@@index([jobId])`
- [x] `WebhookEvent`에 `@@unique([provider, eventId])`가 존재하는가?
- [x] `ReportJob`에 `jobKey String @unique`가 존재하는가? (enqueue 멱등)
- [x] Runner 킬스위치가 `JOBS_ENABLED !== "true"`면 no-op 인가?

---

## 1) 로컬(DB 없이) 검증
- [x] Prisma Client 생성: `npm exec prisma -- generate`
- [x] 타입체크: `npm exec tsc -- --noEmit`
- [x] Next 빌드(무DB): `npm exec next -- build apps/web`
- [x] 유닛테스트(무DB): `npm exec vitest -- run`
  - [x] `packages/report/templateEngine.test.ts` 통과
  - [x] `packages/report/runnerUtils.test.ts` 통과
  - [x] `packages/report/jobProcessor.test.ts` 통과
  - [x] `packages/db/webhooks/stripeWebhookProcessor.test.ts` 통과
  - [x] `packages/db/payments/stripeCheckout.test.ts` 통과
- [ ] (트러블슈팅) `.next`/`.next-dev` 출력 깨짐/ENOENT 발생 시 `npm run dev:web`로 정리 후 재실행

---

## 2) 마이그레이션/시드(DB 필요)
> DB가 준비된 환경에서만 수행.

- [ ] `prisma/migrations/*/migration.sql`이 모두 존재하고 비어있지 않은가?
- [ ] 마이그레이션 적용(권장: deploy): `npm exec prisma -- migrate deploy`
- [ ] 시드 실행: `npm exec prisma -- db seed`
- [ ] Config 키가 DB에 존재하는가?
  - [ ] `pricing`, `templates`, `locales`, `features`, `job_settings`

---

## 3) Stripe 웹훅 검증(멱등/서명/트랜잭션)
대상: `POST /api/webhooks/stripe`

- [ ] 서명 검증이 **raw body**로 수행되는가? (JSON 파싱 선행 금지)
- [ ] 서명 실패 시:
  - [ ] 응답이 `400`인가?
  - [ ] DB에 `WebhookEvent`가 **기록되지 않는가**?
- [ ] 동일 `eventId`를 2번 보냈을 때:
  - [ ] `WebhookEvent(provider,eventId)`가 중복 생성되지 않는가?
  - [ ] `Purchase(idempotencyKey)`가 중복 생성되지 않는가?
  - [ ] `Report(purchaseId)`가 중복 생성되지 않는가?
  - [ ] `ReportJob(jobKey)`가 중복 생성되지 않는가?
- [ ] 처리 성공 시 `WebhookEvent.status=PROCESSED`로 저장되는가?
- [ ] 처리 중 에러 시:
  - [ ] `WebhookEvent.status=FAILED` + `lastError`가 저장되는가? (PII 포함 금지)

---

## 3.1) Checkout 세션 생성(Stripe)
대상: `POST /api/checkout/create`

- [ ] 요청 바디 검증이 있는가? (`productKey`, `locale`, `checkoutAttemptId`)
- [ ] DB `pricing` Config 기반으로 priceId를 선택하는가? (test/live 분리)
- [ ] Stripe idempotency key를 사용해 중복 클릭 시 동일 세션으로 수렴하는가?
- [ ] `success_url`이 `/me/reports?sessionId={CHECKOUT_SESSION_ID}`로 설정되는가?
- [ ] placeholder priceId면 안전하게 실패하는가? (`PRICING_PRICE_ID_PLACEHOLDER`)

---

## 4) Job Runner 검증(큐/락/TTL/복구)
대상: `POST|GET /api/jobs/runner` (헤더 `x-cron-secret`, 또는 `RUNNER_AUTH_MODE=none`)

- [ ] 인증:
  - [ ] `x-cron-secret` 누락/불일치 시 `401`인가?
  - [ ] (Vercel Cron) `RUNNER_AUTH_MODE=none`일 때 크론 호출이 동작하는가?
- [ ] 킬스위치:
  - [ ] `JOBS_ENABLED != "true"`면 `{disabled:true}`로 종료하는가?
- [ ] 동시성 안전:
  - [ ] due job 픽업이 `FOR UPDATE SKIP LOCKED`(또는 동등)로 동작하는가?
  - [ ] 동일 job이 병렬 실행되지 않는가?
- [ ] TTL(스턱) 복구:
  - [ ] `RUNNING` + `lockedAt`가 TTL 초과이면 stale로 회수되는가?
  - [ ] Report가 이미 `READY + pdfUrl`이면 job을 `SUCCEEDED`로 정리하는가? (중복 생성 방지)

---

## 5) 비용 가드레일(Guardrail) 검증
- [ ] `job_settings` Config를 로드하고, 없으면 기본값으로 동작하는가?
  - [ ] `maxPdfCostKRW=50`, `maxLlmCostKRW=300`, `maxAttempts=5`, `backoffBaseMinutes=2`, `lockTtlMinutes=15`
- [ ] 가드레일 초과 시:
  - [ ] `ReportCost`가 `(jobId,costType)` 기준으로 중복 없이 기록되는가? (`createMany(skipDuplicates:true)` 등)
  - [ ] `metaJson.guardrailTriggered=true` + thresholds/estimates가 기록되는가?
  - [ ] `ReportJob.status=FAILED`, `lastError=COST_GUARDRAIL_EXCEEDED`인가?
  - [ ] `Report.status`는 `PENDING`일 때만 `FAILED`로 바뀌는가? (`READY` 덮어쓰기 금지)
  - [ ] 구조화 로그에 `tag=ALERT_COST_GUARDRAIL`가 남는가? (PII 포함 금지)

---

## 6) PDF 생성/스토리지 검증
- [ ] PDF 생성 엔진이 하나로 고정되어 end-to-end 동작하는가? (`@react-pdf/renderer`)
- [ ] 스토리지 프로바이더가 환경에 맞게 설정되었는가?
  - [ ] Vercel: `REPORT_STORAGE_PROVIDER=vercel_blob` + `BLOB_READ_WRITE_TOKEN`
  - [ ] 로컬/VM: `REPORT_STORAGE_PROVIDER=local` + `REPORT_PUBLIC_DIR`/`REPORT_PUBLIC_BASE_URL`
- [ ] 저장 키가 결정적(deterministic)인가?
  - [ ] `reports/{reportId}/v{report.version}.pdf`
- [ ] 성공 시:
  - [ ] `Report.status=READY`, `pdfUrl` 저장
  - [ ] `ReportJob.status=SUCCEEDED`
  - [ ] `ReportCost(PDF/STORAGE)`가 중복 없이 기록되는가?

---

## 7) Retry/Backoff 검증
- [ ] 실패 시 `attempts += 1` 되는가?
- [ ] `attempts < maxAttempts`면:
  - [ ] `status=QUEUED`
  - [ ] `nextRunAt = now + backoffBaseMinutes * (2^attempts)`
- [ ] `attempts >= maxAttempts`면 `status=FAILED`로 종료되는가?

---

## 8) Admin Ops 검증
대상:
- API: `GET /api/admin/jobs?filter=FAILED|STALE_RUNNING`, `POST /api/admin/requeue-job`, `POST /api/admin/unlock-stale-jobs`
- UI: `/admin/jobs`

- [ ] 모든 admin API가 `x-admin-secret`로 보호되는가?
- [ ] `requeue-job`:
  - [ ] `status=QUEUED`, `nextRunAt=now`, `lockedAt/lockedBy=null`로 초기화되는가?
- [ ] `unlock-stale-jobs`:
  - [ ] READY report는 job을 `SUCCEEDED`로 “정리”하는가?
  - [ ] 그 외 stale RUNNING은 `QUEUED`로 되돌리는가?
  - [ ] 결과 카운트(`succeededCleaned`, `requeued`)가 반환되는가?
- [ ] `/admin/jobs`에서 FAILED/STALE 필터 및 Requeue/Unlock 동작이 되는가?

---

## 9) 보안/컴플라이언스(필수)
- [ ] 로그에 PII(생년월일/출생시간/출생지/원본 입력)가 없는가?
- [ ] Stripe Webhook 서명 검증 실패는 400으로 처리되는가?
- [ ] `CRON_SECRET`, `ADMIN_SECRET`가 누락된 경우 서버가 안전하게 실패(500/401)하는가?

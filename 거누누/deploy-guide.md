# Deploy Guide — Global Saju (Staging → Production)

목표: **결제→웹훅→잡러너→PDF 다운로드**가 스테이징에서 end-to-end로 동작하도록 배포/운영 절차를 정리한다.

원칙:
- `npx` 대신 `npm exec` 사용
- PII(생년월일/출생시간/출생지 등) 로그 금지
- 결제/웹훅/잡은 멱등성 기반으로 운영(중복 전송/재시도 안전)

---

## 0) 권장 런타임
- Node.js 20+ 권장
- 빌드/런은 레포 루트에서 수행(Next app 경로: `apps/web`)

---

## 1) 환경변수 준비
필수 목록은 `docs/ops-env.md` 참고.

스테이징 최소 세트:
- DB URL (아래 중 하나)
  - (Vercel Postgres 연동) `POSTGRES_PRISMA_URL`(자동) + `POSTGRES_URL_NON_POOLING`(자동)
  - (그 외) `DATABASE_URL`
- `STRIPE_SECRET_KEY` (test)
- `STRIPE_WEBHOOK_SECRET`
- `APP_BASE_URL` (예: `https://staging.example.com`)
- `CRON_SECRET`
- `ADMIN_SECRET`
- `JOBS_ENABLED=true`
- `JOB_LOCK_TTL_MINUTES=15`

PDF 저장(스테이징):
- (Vercel 권장) **Vercel Blob 사용**
  - `REPORT_STORAGE_PROVIDER=vercel_blob`
  - `BLOB_READ_WRITE_TOKEN` 설정(또는 Vercel Blob 연결 시 자동 주입)
- (컨테이너/VM) 로컬 파일 저장을 쓸 경우:
  - `REPORT_STORAGE_PROVIDER=local`(기본값)
  - `apps/web/public`이 **쓰기 가능**해야 함
  - 또는 `REPORT_PUBLIC_DIR`로 별도 쓰기 가능한 경로 지정

---

## 2) 설치/빌드
레포 루트에서:
- 의존성 설치: `npm ci`
- Prisma Client 생성: `npm exec prisma -- generate`
- Next 빌드: `npm run build:web`

---

## 3) DB 마이그레이션/시드(스테이징/프로덕션)
DB가 준비된 환경에서:
- 마이그레이션 적용(권장): `npm exec prisma -- migrate deploy`
- 시드: `npm exec prisma -- db seed`

Vercel Postgres 주의:
- 마이그레이션은 보통 `POSTGRES_URL_NON_POOLING`이 더 안전하다(본 레포의 `prisma.config.ts`가 자동 우선 사용).

시드 이후 확인:
- Config 키가 존재: `pricing`, `templates`, `locales`, `features`, `job_settings`

---

## 4) Stripe 설정(스테이징)
### 4.1 상품/가격(priceId) 준비
DB `Config(key="pricing")`에 들어있는 placeholder를 실제 Stripe priceId로 교체해야 한다.

- `pricing.data.products[].stripe.priceId_test` (스테이징)
- `pricing.data.products[].stripe.priceId_live` (프로덕션)

주의:
- placeholder 상태면 `/api/checkout/create`는 `PRICING_PRICE_ID_PLACEHOLDER`로 실패하도록 되어 있다.

### 4.2 웹훅 엔드포인트 생성
Stripe Dashboard → Developers → Webhooks:
- Endpoint URL: `https://<APP_BASE_URL>/api/webhooks/stripe`
- Events: `checkout.session.completed`
- 생성 후 `Signing secret`를 `STRIPE_WEBHOOK_SECRET`에 설정

### 4.3 결제 플로우 스모크
- `/input` → `/result` → `/paywall`에서 “결제하고 PDF 받기”
- 결제 완료 후 `/me/reports?sessionId=...`로 돌아오는지 확인

---

## 5) 잡 러너(Cron) 설정
Runner endpoint:
- `POST /api/jobs/runner`
- `GET /api/jobs/runner` (Vercel Cron 기본)
- Header: `x-cron-secret: <CRON_SECRET>`

스테이징에서 수동 실행 예시:
`curl -X POST -H "x-cron-secret: $CRON_SECRET" "$APP_BASE_URL/api/jobs/runner"`

권장 주기:
- 1분마다 1회(초기 MVP)

Vercel Cron 사용 시:
- `vercel.json`에 cron이 설정되어 있다: `vercel.json:1`
- 커스텀 헤더를 넣을 수 없으면 `RUNNER_AUTH_MODE=none`으로 runner 인증을 끈다(대신 runner는 public endpoint가 됨).
- 보안/원가 리스크가 커지면 QStash/외부 cron으로 전환하고 `RUNNER_AUTH_MODE=header`로 되돌린다.

---

## 6) E2E 검증 포인트(스테이징)
1) 결제 완료(Stripe) → `POST /api/webhooks/stripe` 수신
2) DB에 생성 확인:
   - `WebhookEvent(status=PROCESSED)`
   - `Purchase(status=PAID)`
   - `Report(status=PENDING)`
   - `ReportJob(status=QUEUED)`
3) Runner 실행 후:
   - `Report(status=READY, pdfUrl not null)`
   - `ReportJob(status=SUCCEEDED)`
   - `ReportCost` 기록(가드레일/원가 추적)
4) `/me/reports?sessionId=...`에서 PDF 다운로드 링크 확인

---

## 7) 운영 팁
- 장애 시 즉시: `JOBS_ENABLED=false` (출혈 중단)
- stale RUNNING 정리: `/admin/jobs` → STALE_RUNNING → Unlock bulk
- `.next` 출력 깨짐/ENOENT 대응: `npm run dev:web` (자동 정리)

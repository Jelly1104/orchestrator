# ops-env.md — 환경변수 목록

## DB (Required)
아래 중 **하나 이상**이 필요하다.

### 옵션 A) Vercel Postgres (추천, 샘플 셋업 최단)
Vercel 연동 시 보통 아래가 자동 주입된다(직접 추가 불필요).
- POSTGRES_PRISMA_URL=postgresql://...
- POSTGRES_URL_NON_POOLING=postgresql://...
- POSTGRES_URL=postgresql://...

### 옵션 B) 일반 Postgres/Neon/Supabase
- DATABASE_URL=postgresql://...

### 옵션 C) Prisma Postgres/Accelerate
- DATABASE_URL=prisma+postgres://... (api_key 포함)

## Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

## App Base URL (Checkout redirect URLs)
APP_BASE_URL=https://your-domain.com

## Job Runner Auth
CRON_SECRET=some-long-random-string

## Runner Auth Mode
# header (default): require `x-cron-secret: CRON_SECRET`
# none: allow public runner (needed if using Vercel Cron without custom headers)
RUNNER_AUTH_MODE=header

## Admin Auth
ADMIN_SECRET=some-long-random-string

## Job Controls
JOBS_ENABLED=true
JOB_LOCK_TTL_MINUTES=15

## Optional Report Storage (dev default: local public dir)
## Storage Provider
# local (default) | vercel_blob
REPORT_STORAGE_PROVIDER=vercel_blob

## Vercel Blob (recommended for Vercel serverless)
BLOB_READ_WRITE_TOKEN=...

REPORT_PUBLIC_DIR=./apps/web/public
REPORT_PUBLIC_BASE_URL=http://localhost:3000

## Optional Runner Identity (structured logs)
RUNNER_INSTANCE_ID=runner-1

## Optional Observability
SENTRY_DSN=...

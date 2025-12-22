# PRD — Global Saju (Korean Four Pillars) 수익형 앱 MVP

## 1) 목표
- 4주 내 MVP 런칭
- 무료 → 유료 전환 구조 확립(단건 PDF + 구독)
- 운영 가능한 품질 확보(멱등 결제/재시도 큐/스턱 복구/비상정지/관측성)

## 2) 성공 지표(KPI)
- CVR1: 무료 결과 조회 → Paywall 클릭
- CVR2: Paywall → 결제 성공
- ARPPU: 유료 사용자 평균 매출
- 구독 유지율: M1 유지율
- 운영지표:
  - Webhook 처리 실패율 < 0.5%
  - PDF 생성 실패율 < 1%
  - ReportJob 스턱(RUNNING TTL 초과) < 0.5%
  - 핵심 API p95 < 800ms

## 3) 타겟 사용자
- A: 무료 체험(바이럴 공유)
- B: 정리된 PDF를 소장/공유하고 싶은 사용자(단건 결제)
- C: 매주/매달 방향성/액션이 필요한 사용자(구독)

## 4) 가치 제안
- 무료: 흥미 유발 + 핵심만 제공
- 유료(단건): “결정판 PDF 리포트” (공유 가능/저장 가능)
- 구독: 매달 업데이트/저장/비교 + 행동 플랜 제공

## 5) 범위
### In (MVP)
- 입력(양력, time unknown 허용, 타임존 필수)
- 무료 요약 결과
- 단건 결제 + PDF 생성/다운로드/보관
- 구독 플랜(월)
- 마이페이지(구매 리포트 목록/재다운로드)
- 이벤트 트래킹, Sentry, 구조화 로그
- Admin-lite(잡 재큐/스턱 정리)

### Out (추후)
- 음력/윤달(Phase 2)
- 푸시/메일 알림
- B2B 화이트라벨/관리자 고도화

## 6) 사용자 플로우
1) Landing → 2) Input → 3) Free Result
→ 4) Paywall → 5) Checkout → 6) 결제 성공(웹훅)
→ 7) Report(PENDING) + Job(QUEUED) → 8) PDF READY → 9) 다운로드/보관

## 7) 화면/라우팅(IA)
- / (Landing)
- /input
- /result?profileId=
- /paywall?profileId=
- /checkout?profileId=&productId=
- /me/reports
- /admin/jobs (운영자)
- /legal/privacy, /legal/terms

## 8) 기능 요구사항
### 입력
- 시간 “모름” 옵션 제공(정확도 제한 안내)
- 타임존 필수(초기 UI는 선택, 기본값은 사용자 locale 기반 추정 가능)

### 결과(무료)
- 오행 분포(요약)
- 강점 2~3, 리스크 2~3
- 실행 가능한 액션 3개(측정 가능한 문장)

### 결제
- Stripe 웹훅 서명 검증 + 멱등 처리
- Purchase는 idempotencyKey로 upsert
- 동일 webhook 반복 수신에도 중복 생성 0

### 리포트/PDF
- 템플릿 버전 고정(Report.version)
- 생성 실패 시 재시도(backoff)
- 생성 완료 후 Report.status=READY, pdfUrl 저장
- 원가 추적: ReportCost 기록

## 9) 비기능/운영 요구사항(필수)
- JOBS_ENABLED 킬스위치
- JOB_LOCK_TTL_MINUTES 기반 스턱 복구
- Admin: FAILED/STALE 재큐 및 언락
- 관측성: Sentry + 구조화 로그 + 주요 알림 지점 정의
- DB 백업/복구 절차 문서화
- 키 회전 절차(Stripe/CRON/ADMIN)

## 10) 리스크 & 대응
- 웹훅 중복/누락 → WebhookEvent 저장 + 멱등 + 재처리 가능
- PDF 엔진 장애 → 재시도 + 비상정지 + 운영자 재큐
- i18n 확장 시 문구 난립 → Config/템플릿 DB화 + 버전 고정
- IP 리스크(한류) → 특정 작품/인물 직접 언급 금지, 톤/서사 구조로 차별화

## 11) 로드맵(4주)
- W1: PRD/스키마/웹훅 설계 + core-saju 인터페이스 + 테스트 뼈대
- W2: 입력/무료결과/로그인/기본 UI
- W3: 웹훅/잡러너/PDF/마이페이지/Admin-lite
- W4: 관측성/런북/크론/스모크 테스트/배포

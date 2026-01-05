import React from "react";
import "./OrchestratorValidationDashboard.css";

type Metric = { label: string; value: string; status: "good" | "warn" | "pending" };
type SuccessKPI = { label: string; value: string };
type Activity = { time: string; text: string };
type FileEntry = { name: string; status: "done" | "progress" | "pending"; detail?: string };
type ValidationItem = { label: string; status: "pass" | "fail" | "pending"; note?: string };
type SystemMetric = { label: string; value: string; status: "good" | "warn" | "bad" };

const phaseStatuses = [
  { name: "Phase A", status: "done" },
  { name: "Phase B", status: "in-progress" },
  { name: "Phase C", status: "paused" },
  { name: "Monitoring", status: "idle" },
];

const liveMetrics: Metric[] = [
  { label: "성공률", value: "95%", status: "good" },
  { label: "실행 시간", value: "23분", status: "warn" },
  { label: "메모리", value: "512MB", status: "good" },
  { label: "HITL 대기", value: "2건", status: "pending" },
];

const successKPIs: SuccessKPI[] = [
  { label: "SQL 생성", value: "4/4 ✅" },
  { label: "스키마 일치", value: "100% ✅" },
  { label: "테스트 커버리지", value: "92% ✅" },
  { label: "빌드 상태", value: "PASS ✅" },
  { label: "HITL 트리거", value: "2회 ✅" },
  { label: "보안 위반", value: "0건 ✅" },
];

const recentActivities: Activity[] = [
  { time: "15:32", text: "Phase B SDD.md 생성 완료" },
  { time: "15:30", text: "HITL 체크포인트: 설계 승인 대기" },
  { time: "15:28", text: "Phase A 분석 결과 검증 완료" },
];

const phaseBFiles: FileEntry[] = [
  { name: "IA", status: "done", detail: "# IA.md - 분석 대시보드 정보 구조" },
  { name: "Wire", status: "done" },
  { name: "SDD", status: "progress", detail: "## 1. 메인 네비게이션" },
  { name: "Hand", status: "pending" },
];

const validations: ValidationItem[] = [
  { label: "레거시", status: "pass" },
  { label: "API", status: "pending" },
  { label: "보안", status: "fail" },
  { label: "HITL 체크포인트", status: "pending", note: "[승인대기]" },
  { label: "설계 승인", status: "pending" },
];

const implFiles: FileEntry[] = [
  { name: "Backend/controllers", status: "done" },
  { name: "Backend/services", status: "done" },
  { name: "Backend/repositories", status: "done" },
  { name: "Backend/dto", status: "done" },
  { name: "Backend/tests", status: "done" },
  { name: "Frontend/components/AnalyticsDashboard.tsx", status: "done" },
  { name: "Frontend/components/SegmentChart.tsx", status: "done" },
  { name: "Frontend/components/LoginTrendChart.tsx", status: "done" },
  { name: "Frontend/components/FilterPanel.tsx", status: "done" },
  { name: "Frontend/hooks/useAnalytics.ts", status: "progress" },
  { name: "Frontend/hooks/useCharts.ts", status: "progress" },
  { name: "Frontend/tests/Dashboard.test.tsx", status: "done" },
  { name: "Frontend/tests/Chart.test.tsx", status: "progress" },
];

const implProgress = {
  implementation: { percent: 80, text: "구현 80% (16/20 파일)" },
  tests: { percent: 60, text: "테스트 60% (12/20 파일)" },
  coverage: { percent: 92, text: "커버리지 92% (목표 90% 이상)" },
  checks: "타입체크 PASS · 린트 PASS · 빌드 PASS",
};

const implLogs: Activity[] = [
  { time: "15:45", text: "SegmentChart 컴포넌트 TDD 완료" },
  { time: "15:43", text: "analytics.service.ts 빌드 성공" },
  { time: "15:41", text: "테스트 커버리지 92% 달성" },
];

const monitoringMetrics: SystemMetric[] = [
  { label: "CPU 사용률", value: "45%", status: "good" },
  { label: "메모리", value: "512/1024MB", status: "warn" },
  { label: "디스크 I/O", value: "23MB/s", status: "good" },
  { label: "네트워크", value: "1.2Mbps", status: "good" },
];

const OrchestratorValidationDashboard: React.FC = () => {
  return (
    <div className="ovd-page">
      <header className="ovd-header">
        <div className="ovd-title">🔧 Orchestrator Validation System</div>
        <div className="ovd-actions">
          <button className="ovd-icon-btn">⚙️</button>
          <button className="ovd-icon-btn">👤</button>
        </div>
      </header>

      <nav className="ovd-tabs">
        {phaseStatuses.map((p) => (
          <span key={p.name} className={`ovd-tab ovd-${p.status}`}>
            {p.name}
          </span>
        ))}
      </nav>

      {/* Main Dashboard */}
      <section className="ovd-section">
        <div className="ovd-section-title">파이프라인 진행상황</div>
        <div className="ovd-card ovd-progress-card">
          <div className="ovd-phase-line">
            Phase A: ✅ 완료 · Phase B: ⏳ 진행중 · Phase C: ⏸️ 대기
          </div>
          <div className="ovd-progress-bar">
            <div className="ovd-progress-fill" style={{ width: "67%" }} />
            <span className="ovd-progress-text">67% 완료</span>
          </div>
        </div>

        <div className="ovd-grid-4">
          {liveMetrics.map((m) => (
            <div key={m.label} className="ovd-card ovd-metric">
              <div className="ovd-metric-label">{m.label}</div>
              <div className="ovd-metric-value">{m.value}</div>
              <div className={`ovd-status ovd-${m.status}`}>
                {m.status === "good" ? "✅ 양호" : m.status === "warn" ? "⚠️ 평균" : "⏳ 처리중"}
              </div>
            </div>
          ))}
        </div>

        <div className="ovd-card ovd-success">
          <div className="ovd-section-subtitle">성공 지표 현황</div>
          <div className="ovd-kpi-wrap">
            {successKPIs.map((k) => (
              <span key={k.label} className="ovd-chip">
                {k.label}: {k.value}
              </span>
            ))}
          </div>
        </div>

        <div className="ovd-card">
          <div className="ovd-section-subtitle">최근 활동</div>
          <ul className="ovd-list">
            {recentActivities.map((a) => (
              <li key={a.time}>
                <span className="ovd-time">{a.time}</span> - {a.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Phase A */}
      <section className="ovd-section">
        <div className="ovd-section-title">Phase A: 데이터 분석</div>
        <div className="ovd-card ovd-toolbar">
          <div className="ovd-toolbar-title">Phase A</div>
          <div className="ovd-toolbar-actions">
            <button className="ovd-btn">새로고침</button>
            <button className="ovd-btn ghost">?</button>
          </div>
        </div>

        <div className="ovd-grid-2">
          <div className="ovd-card">
            <div className="ovd-section-subtitle">A1. 활성 회원 세그먼트 조회</div>
            <div className="ovd-filters">
              <span className="ovd-pill">전체 회원유형 ▼</span>
              <span className="ovd-pill">지난 30일 ▼</span>
              <button className="ovd-btn primary">실행</button>
            </div>
            <div className="ovd-block">
              <div className="ovd-bar">UKD001 <span className="ovd-bar-fill" style={{ width: "63%" }} /> 63% (128,487명)</div>
              <div className="ovd-bar">UKD002 <span className="ovd-bar-fill" style={{ width: "8%" }} /> 8% (16,310명)</div>
              <div className="ovd-bar">UKD003 <span className="ovd-bar-fill" style={{ width: "4%" }} /> 4% (8,155명)</div>
              <div className="ovd-bar">기타 <span className="ovd-bar-fill" style={{ width: "25%" }} /> 25% (50,932명)</div>
            </div>
            <div className="ovd-note">쿼리 실행: ✅ 성공 (1.2초) · 결과: 203,884행</div>
          </div>

          <div className="ovd-card">
            <div className="ovd-section-subtitle">A2. 전문과목별 분포 분석</div>
            <div className="ovd-block">
              <div className="ovd-compare">내과 <span className="ovd-chip">15% vs 12% (+3%p)</span></div>
              <div className="ovd-compare">외과 <span className="ovd-chip">10% vs 9% (+1%p)</span></div>
              <div className="ovd-compare">정신과 <span className="ovd-chip warn">18% vs 12% (+6%p)</span></div>
              <div className="ovd-compare">소아과 <span className="ovd-chip">6% vs 8% (-2%p)</span></div>
            </div>
            <div className="ovd-note">쿼리 실행: ✅ 성공 (2.1초) · JOIN 최적화: ✅</div>
          </div>
        </div>

        <div className="ovd-grid-2">
          <div className="ovd-card">
            <div className="ovd-section-subtitle">A3. 로그인 패턴 분석 (대용량)</div>
            <div className="ovd-filters">
              <span className="ovd-pill">LIMIT: 10000 ▼</span>
              <span className="ovd-pill">타임아웃: 30초 ▼</span>
            </div>
            <div className="ovd-block">
              <div className="ovd-compare">06시 ▓▓ 08시 ▓▓▓▓▓▓ 10시 ▓▓▓▓▓▓▓▓ 14시 ▓▓▓▓▓▓▓▓▓▓</div>
              <div className="ovd-compare">18시 ▓▓▓▓▓▓▓▓ 20시 ▓▓▓▓▓▓ 22시 ▓▓▓▓ 24시 ▓▓</div>
            </div>
            <div className="ovd-note">쿼리 실행: ✅ 성공 (8.7초) · 처리량: 10,000 / 22,670,000</div>
          </div>

          <div className="ovd-card">
            <div className="ovd-section-subtitle">A4. 결과 해석 및 인사이트</div>
            <div className="ovd-block">
              <div className="ovd-callout">✨ 핵심 발견사항</div>
              <ul className="ovd-list">
                <li>UKD001 집중도 심화 (63%) - 다양화 전략 필요</li>
                <li>정신과 전문의 활동도 +6%p - 트렌드 분석 권장</li>
                <li>오전 10시 피크 - 업무 시작 전 체크</li>
              </ul>
              <div className="ovd-callout">💡 권장 액션</div>
              <ol className="ovd-list number">
                <li>[HIGH] UKD002/003 확대 캠페인</li>
                <li>[MED] 정신과 특화 콘텐츠 강화</li>
                <li>[LOW] 오전 시간대 알림 최적화</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Phase B */}
      <section className="ovd-section">
        <div className="ovd-section-title">Phase B: 설계 문서 뷰어</div>
        <div className="ovd-grid-2">
          <div className="ovd-card">
            <div className="ovd-section-subtitle">문서 · 상태</div>
            <ul className="ovd-list">
              {phaseBFiles.map((f) => (
                <li key={f.name} className="ovd-file">
                  <span className={`ovd-dot ovd-${f.status}`} /> {f.name} {f.detail ? `— ${f.detail}` : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="ovd-card">
            <div className="ovd-section-subtitle">검증 · HITL</div>
            <ul className="ovd-list">
              {validations.map((v) => (
                <li key={v.label} className="ovd-file">
                  <span className={`ovd-dot ovd-${v.status === "pass" ? "done" : v.status === "fail" ? "fail" : "progress"}`} />
                  {v.label} {v.note ? ` (${v.note})` : ""}
                </li>
              ))}
            </ul>
            <div className="ovd-note">DOMAIN_SCHEMA 준수, USER_LOGIN 대용량 테이블 주의</div>
          </div>
        </div>
      </section>

      {/* Phase C */}
      <section className="ovd-section">
        <div className="ovd-section-title">Phase C: 코드 구현 현황</div>
        <div className="ovd-card ovd-toolbar">
          <div className="ovd-toolbar-title">빌드 · 테스트</div>
          <div className="ovd-toolbar-actions">
            <button className="ovd-btn">빌드</button>
            <button className="ovd-btn ghost">테스트</button>
          </div>
        </div>

        <div className="ovd-grid-2">
          <div className="ovd-card">
            <div className="ovd-section-subtitle">파일 구조</div>
            <ul className="ovd-list">
              {implFiles.map((f) => (
                <li key={f.name} className="ovd-file">
                  <span className={`ovd-dot ovd-${f.status}`} /> {f.name}
                </li>
              ))}
            </ul>
          </div>
          <div className="ovd-card">
            <div className="ovd-section-subtitle">진행 상황</div>
            <div className="ovd-progress-block">
              <label>구현</label>
              <div className="ovd-progress-bar">
                <div className="ovd-progress-fill" style={{ width: `${implProgress.implementation.percent}%` }} />
              </div>
              <span className="ovd-note">{implProgress.implementation.text}</span>
            </div>
            <div className="ovd-progress-block">
              <label>테스트</label>
              <div className="ovd-progress-bar">
                <div className="ovd-progress-fill warn" style={{ width: `${implProgress.tests.percent}%` }} />
              </div>
              <span className="ovd-note">{implProgress.tests.text}</span>
            </div>
            <div className="ovd-progress-block">
              <label>커버리지</label>
              <div className="ovd-progress-bar">
                <div className="ovd-progress-fill" style={{ width: `${implProgress.coverage.percent}%` }} />
              </div>
              <span className="ovd-note">{implProgress.coverage.text}</span>
            </div>
            <div className="ovd-note">{implProgress.checks}</div>
            <div className="ovd-section-subtitle mt-3">최근 로그</div>
            <ul className="ovd-list">
              {implLogs.map((l) => (
                <li key={l.time}>
                  <span className="ovd-time">{l.time}</span> - {l.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Monitoring */}
      <section className="ovd-section">
        <div className="ovd-section-title">시스템 모니터링</div>
        <div className="ovd-card ovd-grid-2">
          <div>
            <div className="ovd-section-subtitle">파이프라인 상태</div>
            <div className="ovd-progress-card">
              <div>Phase A → Phase B → Phase C → Review → Deploy</div>
              <div className="ovd-phase-line">✅ ✅ ⏳ ❌ ❌</div>
              <div className="ovd-note">현재 단계: Phase C 구현 중 (80%) · 다음: Leader Review · 예상 완료: 16:20</div>
            </div>
          </div>
          <div>
            <div className="ovd-section-subtitle">시스템 메트릭</div>
            <div className="ovd-grid-2">
              {monitoringMetrics.map((m) => (
                <div key={m.label} className="ovd-card ovd-metric compact">
                  <div className="ovd-metric-label">{m.label}</div>
                  <div className="ovd-metric-value">{m.value}</div>
                  <div className={`ovd-status ovd-${m.status}`}>
                    {m.status === "good" ? "✅ 정상" : m.status === "warn" ? "⚠️ 주의" : "❌ 문제"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OrchestratorValidationDashboard;

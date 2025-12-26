/**
 * MetricsTracker - 시간/토큰 사용량 추적
 *
 * Orchestrator 실행 시 각 단계별 메트릭을 수집합니다.
 *
 * P1-3: Phase A/B 토큰 분리 추적 (v1.1.0)
 * - phase_a_usage: AnalysisAgent (데이터 분석)
 * - phase_b_usage: LeaderAgent (설계 문서 생성)
 *
 * @version 1.1.0
 * @updated 2025-12-26 - [P1-3] Phase A/B 토큰 분리 추적 추가
 */

export class MetricsTracker {
  constructor(taskId) {
    this.taskId = taskId;
    this.startTime = Date.now();
    this.phases = {};
    this.tokens = {
      leader: { input: 0, output: 0 },
      subagent: { input: 0, output: 0 }
    };
    // P1-3: Phase별 토큰 분리 추적
    this.phaseUsage = {
      phase_a: { input: 0, output: 0, agent: 'AnalysisAgent' },
      phase_b: { input: 0, output: 0, agent: 'LeaderAgent' },
      phase_c: { input: 0, output: 0, agent: 'CodeAgent' }
    };
    this.retryCount = 0;
    this.errors = [];
  }

  /**
   * 단계 시작 기록
   * @param {string} phase - 단계 이름 (planning, coding, review)
   */
  startPhase(phase) {
    this.phases[phase] = {
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: 'in_progress'
    };
  }

  /**
   * 단계 종료 기록
   * @param {string} phase - 단계 이름
   * @param {string} status - 상태 (success, fail, error)
   */
  endPhase(phase, status = 'success') {
    if (this.phases[phase]) {
      this.phases[phase].endTime = Date.now();
      this.phases[phase].duration = this.phases[phase].endTime - this.phases[phase].startTime;
      this.phases[phase].status = status;
    }
  }

  /**
   * 토큰 사용량 추가
   * @param {string} agent - 에이전트 (leader, subagent)
   * @param {number} inputTokens - 입력 토큰 수
   * @param {number} outputTokens - 출력 토큰 수
   */
  addTokens(agent, inputTokens, outputTokens) {
    if (this.tokens[agent]) {
      this.tokens[agent].input += inputTokens || 0;
      this.tokens[agent].output += outputTokens || 0;
    }
  }

  /**
   * P1-3: Phase별 토큰 사용량 추가
   * @param {string} phase - Phase 이름 (phase_a, phase_b, phase_c)
   * @param {number} inputTokens - 입력 토큰 수
   * @param {number} outputTokens - 출력 토큰 수
   */
  addPhaseTokens(phase, inputTokens, outputTokens) {
    if (this.phaseUsage[phase]) {
      this.phaseUsage[phase].input += inputTokens || 0;
      this.phaseUsage[phase].output += outputTokens || 0;
    }
  }

  /**
   * P1-3: Phase별 토큰 사용량 조회
   * @returns {{ phase_a_usage: Object, phase_b_usage: Object, phase_c_usage: Object }}
   */
  getPhaseUsage() {
    return {
      phase_a_usage: {
        agent: this.phaseUsage.phase_a.agent,
        input: this.phaseUsage.phase_a.input,
        output: this.phaseUsage.phase_a.output,
        total: this.phaseUsage.phase_a.input + this.phaseUsage.phase_a.output
      },
      phase_b_usage: {
        agent: this.phaseUsage.phase_b.agent,
        input: this.phaseUsage.phase_b.input,
        output: this.phaseUsage.phase_b.output,
        total: this.phaseUsage.phase_b.input + this.phaseUsage.phase_b.output
      },
      phase_c_usage: {
        agent: this.phaseUsage.phase_c.agent,
        input: this.phaseUsage.phase_c.input,
        output: this.phaseUsage.phase_c.output,
        total: this.phaseUsage.phase_c.input + this.phaseUsage.phase_c.output
      }
    };
  }

  /**
   * 재시도 횟수 증가
   */
  incrementRetry() {
    this.retryCount++;
  }

  /**
   * 에러 기록
   * @param {string} phase - 단계
   * @param {string} message - 에러 메시지
   */
  addError(phase, message) {
    this.errors.push({
      phase,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 전체 소요 시간 (ms)
   */
  getTotalDuration() {
    return Date.now() - this.startTime;
  }

  /**
   * 단계별 소요 시간 요약
   */
  getPhaseDurations() {
    const durations = {};
    for (const [phase, data] of Object.entries(this.phases)) {
      durations[phase] = {
        duration: data.duration,
        durationFormatted: this.formatDuration(data.duration),
        status: data.status
      };
    }
    return durations;
  }

  /**
   * 밀리초를 읽기 쉬운 형식으로 변환
   */
  formatDuration(ms) {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  /**
   * 전체 토큰 사용량
   */
  getTotalTokens() {
    return {
      leader: this.tokens.leader.input + this.tokens.leader.output,
      subagent: this.tokens.subagent.input + this.tokens.subagent.output,
      total: this.tokens.leader.input + this.tokens.leader.output +
             this.tokens.subagent.input + this.tokens.subagent.output
    };
  }

  /**
   * 최종 리포트 생성
   */
  generateReport() {
    const totalDuration = this.getTotalDuration();
    const totalTokens = this.getTotalTokens();
    const phaseUsage = this.getPhaseUsage();

    return {
      taskId: this.taskId,
      timestamp: new Date().toISOString(),
      summary: {
        totalDuration: this.formatDuration(totalDuration),
        totalDurationMs: totalDuration,
        retryCount: this.retryCount,
        errorCount: this.errors.length,
        success: this.errors.length === 0 && this.retryCount < 3
      },
      phases: this.getPhaseDurations(),
      tokens: {
        leader: {
          input: this.tokens.leader.input,
          output: this.tokens.leader.output,
          total: totalTokens.leader
        },
        subagent: {
          input: this.tokens.subagent.input,
          output: this.tokens.subagent.output,
          total: totalTokens.subagent
        },
        grandTotal: totalTokens.total
      },
      // P1-3: Phase별 토큰 사용량
      phaseUsage: phaseUsage,
      errors: this.errors
    };
  }

  /**
   * 콘솔 출력용 리포트
   */
  printReport() {
    const report = this.generateReport();

    console.log('\n' + '='.repeat(60));
    console.log('📊 Orchestrator 실행 리포트');
    console.log('='.repeat(60));

    console.log(`\n📌 Task ID: ${report.taskId}`);
    console.log(`⏱️  총 소요 시간: ${report.summary.totalDuration}`);
    console.log(`🔄 재시도 횟수: ${report.summary.retryCount}/3`);
    console.log(`✅ 성공 여부: ${report.summary.success ? 'SUCCESS' : 'FAIL'}`);

    console.log('\n📈 단계별 소요 시간:');
    for (const [phase, data] of Object.entries(report.phases)) {
      const statusIcon = data.status === 'success' ? '✅' : data.status === 'fail' ? '❌' : '⏳';
      console.log(`   ${statusIcon} ${phase}: ${data.durationFormatted}`);
    }

    console.log('\n🎫 토큰 사용량 (에이전트별):');
    console.log(`   Leader Agent:  ${report.tokens.leader.total.toLocaleString()} (in: ${report.tokens.leader.input.toLocaleString()}, out: ${report.tokens.leader.output.toLocaleString()})`);
    console.log(`   Sub-agent:     ${report.tokens.subagent.total.toLocaleString()} (in: ${report.tokens.subagent.input.toLocaleString()}, out: ${report.tokens.subagent.output.toLocaleString()})`);
    console.log(`   Total:         ${report.tokens.grandTotal.toLocaleString()}`);

    // P1-3: Phase별 토큰 사용량 출력
    console.log('\n📊 토큰 사용량 (Phase별):');
    const phaseA = report.phaseUsage.phase_a_usage;
    const phaseB = report.phaseUsage.phase_b_usage;
    const phaseC = report.phaseUsage.phase_c_usage;
    if (phaseA.total > 0) {
      console.log(`   Phase A (${phaseA.agent}): ${phaseA.total.toLocaleString()} (in: ${phaseA.input.toLocaleString()}, out: ${phaseA.output.toLocaleString()})`);
    }
    if (phaseB.total > 0) {
      console.log(`   Phase B (${phaseB.agent}): ${phaseB.total.toLocaleString()} (in: ${phaseB.input.toLocaleString()}, out: ${phaseB.output.toLocaleString()})`);
    }
    if (phaseC.total > 0) {
      console.log(`   Phase C (${phaseC.agent}): ${phaseC.total.toLocaleString()} (in: ${phaseC.input.toLocaleString()}, out: ${phaseC.output.toLocaleString()})`);
    }
    if (phaseA.total === 0 && phaseB.total === 0 && phaseC.total === 0) {
      console.log('   (Phase별 추적 데이터 없음)');
    }

    if (report.errors.length > 0) {
      console.log('\n❌ 에러 목록:');
      for (const err of report.errors) {
        console.log(`   [${err.phase}] ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));

    return report;
  }
}

export default MetricsTracker;

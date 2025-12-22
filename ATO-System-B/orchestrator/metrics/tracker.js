/**
 * MetricsTracker - 시간/토큰 사용량 추적
 *
 * Orchestrator 실행 시 각 단계별 메트릭을 수집합니다.
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

    console.log('\n🎫 토큰 사용량:');
    console.log(`   Leader Agent:  ${report.tokens.leader.total.toLocaleString()} (in: ${report.tokens.leader.input.toLocaleString()}, out: ${report.tokens.leader.output.toLocaleString()})`);
    console.log(`   Sub-agent:     ${report.tokens.subagent.total.toLocaleString()} (in: ${report.tokens.subagent.input.toLocaleString()}, out: ${report.tokens.subagent.output.toLocaleString()})`);
    console.log(`   Total:         ${report.tokens.grandTotal.toLocaleString()}`);

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

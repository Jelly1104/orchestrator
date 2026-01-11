/**
 * Feedback Loop Controller
 *
 * 검증 실패 시 자동 재작업 요청 → 완료까지 반복
 *
 * 플로우:
 * 1. 산출물 검증 (Output Validator)
 * 2. 실패 시 누락 항목 추출
 * 3. 재작업 프롬프트 생성
 * 4. SubAgent에 재작업 요청
 * 5. 다시 검증 (최대 N회 반복)
 *
 * @version 1.0.0
 */

import { OutputValidator } from './output-validator.js';

const MAX_RETRY_COUNT = 3;

export class FeedbackLoopController {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.maxRetries = options.maxRetries || MAX_RETRY_COUNT;
    this.outputValidator = new OutputValidator(projectRoot);
    this.history = [];
  }

  /**
   * 검증 + 피드백 루프 실행
   * @param {Array} outputs - 산출물 목록 [{ name, type, content }]
   * @param {Object} prdAnalysis - PRD 분석 결과
   * @param {Function} retryCallback - 재작업 콜백 (missingItems) => Promise<newOutputs>
   * @returns {Object} - { passed, outputs, retryCount, history }
   */
  async runWithFeedback(outputs, prdAnalysis, retryCallback) {
    let currentOutputs = outputs;
    let retryCount = 0;
    // 방어적 초기화: while 루프 진입 실패 시에도 안전한 반환값 보장
    let validationResult = { passed: false, errors: [], prdMatch: { matched: 0, total: 0, missing: [] } };

    console.log('\n🔄 피드백 루프 시작...\n');

    while (retryCount <= this.maxRetries) {
      // 검증 실행
      validationResult = this.outputValidator.validate(currentOutputs, prdAnalysis);

      // 히스토리 기록
      this.history.push({
        attempt: retryCount + 1,
        timestamp: new Date().toISOString(),
        outputCount: currentOutputs.length,
        passed: validationResult.passed,
        matched: validationResult.prdMatch?.matched || 0,
        total: validationResult.prdMatch?.total || 0,
        missing: validationResult.prdMatch?.missing || []
      });

      // 통과 시 종료
      if (validationResult.passed) {
        console.log(`✅ 검증 통과 (시도: ${retryCount + 1}회)`);
        break;
      }

      // 최대 재시도 초과
      if (retryCount >= this.maxRetries) {
        console.log(`\n❌ 최대 재시도 횟수(${this.maxRetries}) 초과`);
        break;
      }

      // 누락 항목 추출
      const missing = validationResult.prdMatch?.missing || [];
      const errors = validationResult.errors || [];

      console.log(`\n⚠️  검증 실패 (시도: ${retryCount + 1}/${this.maxRetries + 1})`);
      console.log(`   - PRD 매칭: ${validationResult.prdMatch?.matched}/${validationResult.prdMatch?.total}`);
      console.log(`   - 누락 항목: ${missing.length}개`);

      // 피드백 생성
      const feedback = this.generateFeedback(missing, errors);
      console.log('\n📝 재작업 피드백:');
      console.log(feedback);

      // 재작업 콜백 실행
      if (retryCallback) {
        console.log('\n🔧 재작업 요청 중...');
        try {
          const newOutputs = await retryCallback(missing, feedback, currentOutputs);
          if (newOutputs && newOutputs.length > 0) {
            // 기존 산출물에 새로운 산출물 추가/병합
            currentOutputs = this.mergeOutputs(currentOutputs, newOutputs);
          }
        } catch (error) {
          console.error(`   재작업 실패: ${error.message}`);
        }
      }

      retryCount++;
    }

    return {
      passed: validationResult.passed,
      outputs: currentOutputs,
      retryCount,
      validationResult,
      history: this.history
    };
  }

  /**
   * 피드백 메시지 생성
   */
  generateFeedback(missing, errors) {
    let feedback = '';

    if (missing.length > 0) {
      feedback += '## 누락된 PRD 체크리스트 항목\n';
      feedback += '다음 항목들이 누락되었습니다. 추가로 생성해주세요:\n\n';
      missing.forEach((item, i) => {
        feedback += `${i + 1}. ${item}\n`;
      });
      feedback += '\n';
    }

    if (errors.length > 0) {
      feedback += '## 검증 오류\n';
      errors.forEach((e, i) => {
        feedback += `${i + 1}. [${e.type}] ${e.message}\n`;
      });
      feedback += '\n';
    }

    feedback += '## 요청 사항\n';
    feedback += '- 위 누락 항목에 대한 산출물을 생성해주세요\n';
    feedback += '- 기존에 생성된 산출물은 유지합니다\n';
    feedback += '- PRD 체크리스트와 이름이 매칭되도록 파일명을 지정해주세요\n';

    return feedback;
  }

  /**
   * 산출물 병합 (기존 + 신규)
   */
  mergeOutputs(existing, newOutputs) {
    const merged = [...existing];
    const existingNames = new Set(existing.map(o => o.name.toLowerCase()));

    for (const output of newOutputs) {
      // 이름이 없는 경우 건너뛰기
      if (!output.name) continue;

      // 중복 체크 (동일 이름 → 덮어쓰기)
      const lowerName = output.name.toLowerCase();
      if (existingNames.has(lowerName)) {
        const index = merged.findIndex(o => o.name.toLowerCase() === lowerName);
        if (index >= 0) {
          merged[index] = output;
        }
      } else {
        merged.push(output);
        existingNames.add(lowerName);
      }
    }

    return merged;
  }

  /**
   * 히스토리 포맷팅
   */
  formatHistory() {
    let output = '';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    output += '📊 피드백 루프 히스토리\n';
    output += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    this.history.forEach(h => {
      const icon = h.passed ? '✅' : '❌';
      output += `[시도 ${h.attempt}] ${icon} PRD 매칭: ${h.matched}/${h.total}`;
      if (h.missing.length > 0) {
        output += ` (누락: ${h.missing.length}개)`;
      }
      output += '\n';
    });

    output += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    return output;
  }

  /**
   * 히스토리 리셋
   */
  resetHistory() {
    this.history = [];
  }
}

export default FeedbackLoopController;

/**
 * HandoffValidator - Handoff 프로토콜 스키마 검증
 *
 * 보안 기능 (v3.2.0 P2):
 * - Leader → Sub-agent 핸드오프 검증
 * - 필수 섹션 확인
 * - 악의적 지시 필터링
 *
 * @version 1.1.0
 * @updated 2025-12-29 - CompletionCriteria 필수 섹션 승격
 * @see HANDOFF_PROTOCOL.md
 */

// HANDOFF 필수 섹션 (개발 지시서 DD-2025-001 반영)
const REQUIRED_SECTIONS = [
  'Mode',               // Coding, Review 등
  'Input',              // 입력 문서
  'Output',             // 기대 산출물
  'Constraints',        // 제약사항
  'CompletionCriteria', // 완료 기준 (필수로 승격)
];

// 선택적 섹션
const OPTIONAL_SECTIONS = [
  'References',          // 참조 문서
  'Notes',               // 비고
  'Context',             // 컨텍스트
];

// 위험한 지시 패턴
const DANGEROUS_PATTERNS = [
  // 시스템 우회 시도
  /ignore\s+(previous|above|all)\s+(instructions|rules|constraints)/i,
  /disregard\s+(previous|all)/i,
  /bypass\s+(security|validation|checks)/i,

  // 권한 상승 시도
  /you\s+(are|have)\s+(now|full|admin|root)/i,
  /grant\s+(yourself|me)\s+(access|permission)/i,

  // 파일 시스템 조작
  /delete\s+(all|system|config)/i,
  /rm\s+-rf/i,
  /format\s+/i,

  // 외부 통신
  /send\s+(to|data|request)/i,
  /upload\s+to/i,
  /exfiltrate/i,

  // 코드 실행
  /execute\s+(command|shell|bash)/i,
  /run\s+(as|with)\s+(sudo|root)/i,
];

export class HandoffValidator {
  constructor(config = {}) {
    this.strictMode = config.strictMode !== false; // 기본값 true
    this.customPatterns = config.dangerousPatterns || [];
  }

  /**
   * HANDOFF 문서 파싱
   */
  parseHandoff(content) {
    const sections = {};

    // 마크다운 헤더 기반 섹션 파싱
    const sectionRegex = /##\s*(\w+)[\s\S]*?(?=##\s*\w+|$)/g;
    let match;

    while ((match = sectionRegex.exec(content)) !== null) {
      const sectionName = match[1];
      const sectionContent = match[0].replace(/##\s*\w+\s*\n?/, '').trim();
      sections[sectionName] = sectionContent;
    }

    // 대소문자 무관 매칭을 위한 정규화
    const normalizedSections = {};
    for (const [key, value] of Object.entries(sections)) {
      normalizedSections[key.toLowerCase()] = value;
    }

    return { raw: sections, normalized: normalizedSections };
  }

  /**
   * 필수 섹션 검증
   */
  validateRequiredSections(parsed) {
    const missing = [];
    const found = [];

    for (const section of REQUIRED_SECTIONS) {
      const normalized = section.toLowerCase();
      if (parsed.normalized[normalized]) {
        found.push(section);
      } else {
        missing.push(section);
      }
    }

    return {
      valid: missing.length === 0,
      found,
      missing,
    };
  }

  /**
   * 위험한 지시 감지
   */
  detectDangerousPatterns(content) {
    const detected = [];
    const allPatterns = [...DANGEROUS_PATTERNS, ...this.customPatterns];

    for (const pattern of allPatterns) {
      if (pattern.test(content)) {
        detected.push({
          pattern: pattern.toString(),
          match: content.match(pattern)?.[0] || '',
        });
      }
    }

    return detected;
  }

  /**
   * Mode 값 검증
   */
  validateMode(parsed) {
    const mode = parsed.normalized['mode'];

    if (!mode) {
      return { valid: false, error: 'Mode not specified' };
    }

    const validModes = ['coding', 'review', 'test', 'refactor', 'debug'];
    const modeValue = mode.toLowerCase().trim();

    if (!validModes.some(m => modeValue.includes(m))) {
      return {
        valid: false,
        error: `Invalid mode: ${mode}. Expected one of: ${validModes.join(', ')}`,
      };
    }

    return { valid: true, mode: modeValue };
  }

  /**
   * 전체 검증
   * @param {string} handoffContent - HANDOFF 문서 내용
   * @returns {Object} - 검증 결과
   */
  validate(handoffContent) {
    if (!handoffContent || typeof handoffContent !== 'string') {
      return {
        valid: false,
        error: 'Invalid handoff content: must be a non-empty string',
        sections: { valid: false },
        mode: { valid: false },
        security: { safe: false },
      };
    }

    const parsed = this.parseHandoff(handoffContent);

    // 1. 필수 섹션 검증
    const sectionsResult = this.validateRequiredSections(parsed);

    // 2. Mode 검증
    const modeResult = this.validateMode(parsed);

    // 3. 보안 검증
    const dangerousPatterns = this.detectDangerousPatterns(handoffContent);
    const securityResult = {
      safe: dangerousPatterns.length === 0,
      threats: dangerousPatterns,
    };

    // 전체 결과
    const valid = sectionsResult.valid && modeResult.valid && securityResult.safe;

    return {
      valid,
      sections: sectionsResult,
      mode: modeResult,
      security: securityResult,
      parsed,
    };
  }

  /**
   * 검증 및 리포트 출력
   */
  validateAndReport(handoffContent) {
    const result = this.validate(handoffContent);

    console.log('\n📋 Handoff Validation Report');
    console.log('='.repeat(40));

    // 섹션 검증
    if (result.sections.valid) {
      console.log(`✅ Required sections: All present (${result.sections.found.length})`);
    } else {
      console.log(`❌ Required sections: Missing ${result.sections.missing.length}`);
      result.sections.missing.forEach(s => console.log(`   - ${s}`));
    }

    // Mode 검증
    if (result.mode.valid) {
      console.log(`✅ Mode: ${result.mode.mode}`);
    } else {
      console.log(`❌ Mode: ${result.mode.error}`);
    }

    // 보안 검증
    if (result.security.safe) {
      console.log(`✅ Security: No threats detected`);
    } else {
      console.log(`⚠️  Security: ${result.security.threats.length} threat(s) detected`);
      result.security.threats.forEach(t => {
        console.log(`   - Pattern: ${t.pattern}`);
        console.log(`     Match: "${t.match}"`);
      });
    }

    console.log('='.repeat(40));
    console.log(result.valid ? '✅ Handoff validation passed' : '❌ Handoff validation failed');

    return result;
  }

  /**
   * 파이프라인 중단 및 Leader 재생성 요청
   * 필수 섹션 누락 시 호출
   * @param {Object} validationResult - 검증 결과
   * @returns {Object} - 재생성 요청 정보
   */
  requestRegeneration(validationResult) {
    if (validationResult.valid) {
      return { needed: false };
    }

    const feedback = [];

    if (!validationResult.sections.valid) {
      feedback.push(`Missing required sections: ${validationResult.sections.missing.join(', ')}`);
      feedback.push('Please regenerate HANDOFF.md with all required sections:');
      REQUIRED_SECTIONS.forEach(s => feedback.push(`  - ${s}`));
    }

    if (!validationResult.mode.valid) {
      feedback.push(`Invalid mode: ${validationResult.mode.error}`);
    }

    if (!validationResult.security.safe) {
      feedback.push('Security threats detected - please remove dangerous patterns');
    }

    return {
      needed: true,
      action: 'REGENERATE_HANDOFF',
      feedback: feedback.join('\n'),
      requiredSections: REQUIRED_SECTIONS,
    };
  }
}

export { REQUIRED_SECTIONS, OPTIONAL_SECTIONS, DANGEROUS_PATTERNS };
export default HandoffValidator;

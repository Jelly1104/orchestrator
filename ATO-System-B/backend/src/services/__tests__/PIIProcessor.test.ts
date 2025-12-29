import { describe, it, expect, beforeEach } from 'vitest';
import { PIIProcessor } from '../PIIProcessor';

describe('PIIProcessor', () => {
  let processor: PIIProcessor;

  beforeEach(() => {
    processor = new PIIProcessor();
  });

  describe('maskSensitiveData', () => {
    it('병원명을 A병원, B의원으로 마스킹해야 한다', async () => {
      const input = '서울대병원에서 근무하다가 강남성형외과의원으로 이직했습니다.';
      const result = await processor.maskSensitiveData(input);
      
      expect(result).toContain('A병원');
      expect(result).toContain('B의원');
      expect(result).not.toContain('서울대병원');
      expect(result).not.toContain('강남성형외과의원');
    });

    it('의사명을 김○○ 선생님으로 마스킹해야 한다', async () => {
      const input = '김철수 선생님과 이영희선생님이 진료를 보셨습니다.';
      const result = await processor.maskSensitiveData(input);
      
      expect(result).toContain('김○○ 선생님');
      expect(result).toContain('이○○ 선생님');
      expect(result).not.toContain('김철수');
      expect(result).not.toContain('이영희');
    });

    it('연락처와 이메일을 완전 제거해야 한다', async () => {
      const input = '연락처: 02-1234-5678, 이메일: doctor@hospital.com';
      const result = await processor.maskSensitiveData(input);
      
      expect(result).toContain('[연락처 삭제]');
      expect(result).toContain('[이메일 삭제]');
      expect(result).not.toContain('02-1234-5678');
      expect(result).not.toContain('doctor@hospital.com');
    });

    it('주민번호와 면허번호를 안전하게 제거해야 한다', async () => {
      const input = '주민번호: 123456-1234567, 면허번호: MD123456입니다.';
      const result = await processor.maskSensitiveData(input);
      
      expect(result).toContain('[개인정보 삭제]');
      expect(result).toContain('[면허번호 삭제]');
      expect(result).not.toContain('123456-1234567');
      expect(result).not.toContain('MD123456');
    });

    it('빈 문자열이나 null 입력을 안전하게 처리해야 한다', async () => {
      expect(await processor.maskSensitiveData('')).toBe('');
      expect(await processor.maskSensitiveData('   ')).toBe('   ');
      expect(await processor.maskSensitiveData(null as any)).toBe('');
      expect(await processor.maskSensitiveData(undefined as any)).toBe('');
    });

    it('동일한 병원명이 여러 번 나와도 일관되게 마스킹해야 한다', async () => {
      const input = '서울대병원에서 근무 중입니다. 서울대병원은 좋은 곳이에요.';
      const result = await processor.maskSensitiveData(input);
      
      // 같은 병원명은 같은 레이블(A병원)로 일관되게 마스킹
      const matches = result.match(/A병원/g);
      expect(matches).toHaveLength(2);
      expect(result).not.toContain('서울대병원');
    });

    it('특수문자가 포함된 병원명도 안전하게 처리해야 한다', async () => {
      const input = 'Dr.김의 (병원)에서 근무합니다.';
      const result = await processor.maskSensitiveData(input);
      
      expect(typeof result).toBe('string');
      // 크래시하지 않고 문자열을 반환해야 함
    });
  });

  describe('detectPIITypes', () => {
    it('PII 유형을 정확히 감지해야 한다', () => {
      const input = '서울대병원의 김철수 선생님께서 02-1234-5678로 연락주세요.';
      const result = processor.detectPIITypes(input);
      
      expect(result).toContain('병원명');
      expect(result).toContain('의사명');
      expect(result).toContain('연락처');
      expect(result).toHaveLength(3);
    });

    it('주민번호와 면허번호를 감지해야 한다', () => {
      const input = '면허번호 MD123456, 주민번호 123456-1234567';
      const result = processor.detectPIITypes(input);
      
      expect(result).toContain('면허번호');
      expect(result).toContain('주민번호');
    });

    it('PII가 없으면 빈 배열을 반환해야 한다', () => {
      const input = '오늘 진료가 많이 바빴습니다.';
      const result = processor.detectPIITypes(input);
      
      expect(result).toEqual([]);
    });

    it('null/undefined 입력을 안전하게 처리해야 한다', () => {
      expect(processor.detectPIITypes('')).toEqual([]);
      expect(processor.detectPIITypes(null as any)).toEqual([]);
      expect(processor.detectPIITypes(undefined as any)).toEqual([]);
    });

    it('중복된 PII 유형은 한 번만 반환해야 한다', () => {
      const input = '서울대병원과 연세대병원에서 김철수 선생님과 이영희 선생님이 근무합니다.';
      const result = processor.detectPIITypes(input);
      
      expect(result).toContain('병원명');
      expect(result).toContain('의사명');
      // 중복 제거 확인
      expect(result.filter(type => type === '병원명')).toHaveLength(1);
      expect(result.filter(type => type === '의사명')).toHaveLength(1);
    });
  });
});
import { describe, it, expect } from 'vitest';
import { AnalysisService } from '../../src/analysis/services/AnalysisService';
import { MemberTypeDistribution } from '../../src/analysis/types';

describe('AnalysisService', () => {
  describe('getMemberTypeName', () => {
    it('표준 회원 유형을 올바른 한글명으로 변환해야 한다', () => {
      expect(AnalysisService.getMemberTypeName('DOC001')).toBe('의사');
      expect(AnalysisService.getMemberTypeName('PHM001')).toBe('약사');
      expect(AnalysisService.getMemberTypeName('NUR001')).toBe('간호사');
    });

    it('알 수 없는 유형은 코드를 포함한 기타로 표시해야 한다', () => {
      expect(AnalysisService.getMemberTypeName('XYZ999')).toBe('기타(XYZ999)');
    });
  });

  describe('processMemberTypeData', () => {
    it('DB 원시 데이터를 MemberTypeDistribution으로 변환해야 한다', () => {
      const rawData = [
        {
          MEMBER_TYPE: 'DOC001',
          TOTAL_COUNT: '15000',
          PERCENTAGE: '65.5'
        },
        {
          MEMBER_TYPE: 'PHM001', 
          TOTAL_COUNT: '5000',
          PERCENTAGE: '21.7'
        }
      ];

      const result = AnalysisService.processMemberTypeData(rawData);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        memberType: 'DOC001',
        memberTypeName: '의사',
        totalCount: 15000,
        percentage: 65.5
      });
    });
  });

  describe('generateBasicInsights', () => {
    it('회원 분포 기반 기본 인사이트를 생성해야 한다', () => {
      const memberTypes: MemberTypeDistribution[] = [
        {
          memberType: 'DOC001',
          memberTypeName: '의사',
          totalCount: 15000,
          percentage: 75.0
        }
      ];

      const insights = AnalysisService.generateBasicInsights(memberTypes, 20000);

      expect(insights).toContain('총 활성 회원 20,000명');
      expect(insights).toContain('최대 회원군: 의사 15,000명 (75%)');
      expect(insights).toContain('의사 회원: 15,000명 (75%)');
    });
  });

  describe('generateBasicTriggers', () => {
    it('회원 수 기반으로 실현 가능한 트리거를 생성해야 한다', () => {
      const memberTypes: MemberTypeDistribution[] = [
        {
          memberType: 'DOC001',
          memberTypeName: '의사', 
          totalCount: 10000,
          percentage: 100.0
        }
      ];

      const triggers = AnalysisService.generateBasicTriggers(memberTypes);

      expect(triggers).toHaveLength(2);
      expect(triggers[0].triggerName).toBe('신규_회원_온보딩');
      expect(triggers[0].estimatedReach).toBe(500); // 5% of 10000
      expect(triggers[1].estimatedReach).toBe(3000); // 30% of 10000
    });
  });

  describe('generateBasicAnalysisResult', () => {
    it('전체 분석 결과를 올바르게 조합해야 한다', () => {
      const memberTypes: MemberTypeDistribution[] = [
        {
          memberType: 'DOC001',
          memberTypeName: '의사',
          totalCount: 12000,
          percentage: 80.0
        }
      ];

      const registrationTrend = [
        { month: '2025-12', newMembers: 150 }
      ];

      const result = AnalysisService.generateBasicAnalysisResult(memberTypes, registrationTrend);

      expect(result.totalMembers).toBe(12000);
      expect(result.activeMembersByType).toEqual(memberTypes);
      expect(result.registrationTrend).toEqual(registrationTrend);
      expect(result.basicInsights.length).toBeGreaterThan(0);
      expect(result.simpleRecommendations.length).toBeGreaterThan(0);
    });
  });
});
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActiveMemberAnalyzer } from '../../src/services/ActiveMemberAnalyzer';
import type { ActiveMemberReport, MemberSegment } from '../../src/types/active-member.types';

describe('ActiveMemberAnalyzer', () => {
  let analyzer: ActiveMemberAnalyzer;
  
  beforeEach(() => {
    analyzer = new ActiveMemberAnalyzer();
  });

  describe('활성 회원 세그먼트 정의', () => {
    it('최근 30일 로그인한 의사만 활성 회원으로 분류해야 한다', async () => {
      // Arrange
      const mockDbResult = [
        { U_ID: 'DOC001', U_KIND: 'DOC001', LAST_LOGIN: '2025-12-10' },
        { U_ID: 'DOC002', U_KIND: 'DOC001', LAST_LOGIN: '2025-11-01' }, // 비활성
      ];
      
      vi.spyOn(analyzer, 'executeQuery').mockResolvedValue(mockDbResult);
      
      // Act
      const result = await analyzer.getActiveMembers();
      
      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].U_ID).toBe('DOC001');
    });
  });

  describe('프로필-행동 조인 분석', () => {
    it('활성 회원의 전문과목별 분포를 계산해야 한다', async () => {
      // Arrange
      const mockData = [
        { U_MAJOR_CODE_1: 'IM', COUNT: 150 },
        { U_MAJOR_CODE_1: 'GS', COUNT: 80 },
        { U_MAJOR_CODE_1: 'PSY', COUNT: 45 }
      ];
      
      vi.spyOn(analyzer, 'executeQuery').mockResolvedValue(mockData);
      
      // Act
      const result = await analyzer.getMajorDistribution('active');
      
      // Assert
      expect(result).toBeDefined();
      expect(result.find(item => item.major === 'IM')?.count).toBe(150);
    });
  });

  describe('분포 비교 및 통계 분석', () => {
    it('전문과목별 활성 vs 전체 비교에서 과대표/과소표현을 판단해야 한다', async () => {
      // Arrange
      const activeData = [{ major: 'IM', count: 60, percentage: 30 }];
      const totalData = [{ major: 'IM', count: 400, percentage: 20 }];
      
      // Act
      const result = analyzer.compareDistributions(activeData, totalData);
      
      // Assert
      expect(result[0].representation).toBe('OVER_REP'); // 30% vs 20% = 과대표현
      expect(result[0].variance).toBeCloseTo(50, 1); // (30-20)/20 * 100 = 50%
    });

    it('5명 미만 세그먼트는 기타로 처리해야 한다', async () => {
      // Arrange
      const smallSegmentData = [
        { major: 'IM', count: 100 },
        { major: 'RARE', count: 3 } // 5명 미만
      ];
      
      // Act
      const result = analyzer.applyPrivacyFilter(smallSegmentData);
      
      // Assert
      expect(result.find(item => item.major === 'RARE')).toBeUndefined();
      expect(result.find(item => item.major === 'ETC')).toBeDefined();
    });
  });

  describe('리포트 생성', () => {
    it('JSON 형태의 활성 회원 프로파일 요약을 생성해야 한다', async () => {
      // Act
      const report = await analyzer.generateActiveMemberReport();
      
      // Assert
      expect(report).toHaveProperty('metadata');
      expect(report).toHaveProperty('segments');
      expect(report).toHaveProperty('comparisons');
      expect(report).toHaveProperty('insights');
      expect(report.metadata.reportDate).toBeDefined();
    });
  });

  describe('G1 Use Case 트리거', () => {
    it('활성 회원 중 채용 관련 행동 패턴을 가진 후보를 제안해야 한다', async () => {
      // Act
      const triggers = await analyzer.suggestG1UseCaseTriggers();
      
      // Assert
      expect(triggers).toBeInstanceOf(Array);
      expect(triggers.length).toBeGreaterThan(0);
      expect(triggers[0]).toHaveProperty('triggerType');
      expect(triggers[0]).toHaveProperty('targetSegment');
      expect(triggers[0]).toHaveProperty('reasoning');
    });
  });
});
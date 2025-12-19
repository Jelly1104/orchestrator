import { describe, it, expect } from 'vitest';
import { NoticeService } from '../../src/services/NoticeService';
import { NoticeLegacyDto, UserProfileDto } from '../../src/types/notice.types';

describe('NoticeService', () => {
  
  // 테스트용 Mock 데이터 (DOMAIN_SCHEMA.md 준수)
  const mockUserProfile: UserProfileDto = {
    U_ID: 'doc123',
    U_MAJOR_CODE_1: 'IM',        // 내과
    U_WORK_TYPE_1: 'OWN',        // 개원의
    U_CAREER_YEAR: 5
  };

  const mockNotice: NoticeLegacyDto = {
    BOARD_IDX: 1,
    CTG_CODE: 'NOT001',
    TARGET_MAJOR: '["IM","GS"]',  // 내과, 외과 대상
    TARGET_WORK: '["OWN","EMP"]', // 개원의, 봉직의 대상
    TITLE: '신규 서비스 오픈 안내',
    CONTENT: '새로운 서비스가 오픈되었습니다.',
    IMPORTANCE: 3,
    U_ID: 'admin',
    REG_DATE: '2025-12-16T10:00:00Z',
    DISPLAY_FLAG: 'Y',
    DEL_FLAG: 'N'
  };

  describe('calculateRelevanceScore', () => {
    
    it('전문과목과 근무형태가 모두 일치하면 높은 점수를 받아야 한다', () => {
      // Arrange & Act
      const score = NoticeService.calculateRelevanceScore({
        notice: mockNotice,
        userProfile: mockUserProfile
      });

      // Assert
      expect(score).toBeGreaterThan(0.8); // 0.5 + 0.3(전문과목) + 0.2(근무형태) = 1.0+
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('전문과목만 일치하면 중간 점수를 받아야 한다', () => {
      // Arrange
      const nonMatchingNotice: NoticeLegacyDto = {
        ...mockNotice,
        TARGET_WORK: '["RES"]' // 전공의만 대상 (매칭 안됨)
      };

      // Act
      const score = NoticeService.calculateRelevanceScore({
        notice: nonMatchingNotice,
        userProfile: mockUserProfile
      });

      // Assert
      expect(score).toBeGreaterThan(0.5);  // 0.5 + 0.3(전문과목)
      expect(score).toBeLessThan(0.9);     // 근무형태 매칭 점수 없음
    });

    it('매칭되지 않으면 기본 점수를 받아야 한다', () => {
      // Arrange
      const nonMatchingNotice: NoticeLegacyDto = {
        ...mockNotice,
        TARGET_MAJOR: '["PSY"]',  // 정신과 (매칭 안됨)
        TARGET_WORK: '["RES"]'    // 전공의 (매칭 안됨)
      };

      // Act
      const score = NoticeService.calculateRelevanceScore({
        notice: nonMatchingNotice,
        userProfile: mockUserProfile
      });

      // Assert
      expect(score).toBe(0.5); // 기본 점수만
    });

    it('잘못된 JSON 형식이어도 오류가 발생하지 않아야 한다', () => {
      // Arrange
      const invalidNotice: NoticeLegacyDto = {
        ...mockNotice,
        TARGET_MAJOR: 'invalid_json',  // 잘못된 JSON
        TARGET_WORK: '{"invalid": true}'
      };

      // Act & Assert
      expect(() => {
        const score = NoticeService.calculateRelevanceScore({
          notice: invalidNotice,
          userProfile: mockUserProfile
        });
        expect(score).toBe(0.5); // 파싱 실패 시 기본값
      }).not.toThrow();
    });

    it('중요도가 높으면 추가 점수를 받아야 한다', () => {
      // Arrange
      const highImportanceNotice: NoticeLegacyDto = {
        ...mockNotice,
        IMPORTANCE: 5,           // 최고 중요도
        TARGET_MAJOR: '["PSY"]', // 매칭 안됨
        TARGET_WORK: '["RES"]'   // 매칭 안됨
      };

      // Act
      const score = NoticeService.calculateRelevanceScore({
        notice: highImportanceNotice,
        userProfile: mockUserProfile
      });

      // Assert
      expect(score).toBeGreaterThan(0.5); // 기본 + 중요도 점수
      expect(score).toBeLessThanOrEqual(0.6); // 0.5 + (5/5)*0.1 = 0.6
    });
  });

  describe('personalizeNotices', () => {
    
    it('관련성 점수 순으로 정렬되어야 한다', () => {
      // Arrange
      const notices: NoticeLegacyDto[] = [
        { ...mockNotice, BOARD_IDX: 1, TARGET_MAJOR: '["PSY"]', TARGET_WORK: '["RES"]' }, // 낮은 점수
        { ...mockNotice, BOARD_IDX: 2, TARGET_MAJOR: '["IM"]', TARGET_WORK: '["OWN"]' },  // 높은 점수
        { ...mockNotice, BOARD_IDX: 3, TARGET_MAJOR: '["IM"]', TARGET_WORK: '["RES"]' }   // 중간 점수
      ];

      // Act
      const personalizedNotices = NoticeService.personalizeNotices(notices, mockUserProfile);

      // Assert
      expect(personalizedNotices).toHaveLength(3);
      expect(personalizedNotices[0].BOARD_IDX).toBe(2); // 가장 높은 점수
      expect(personalizedNotices[0].RELEVANCE_SCORE).toBeGreaterThan(personalizedNotices[1].RELEVANCE_SCORE);
      expect(personalizedNotices[1].RELEVANCE_SCORE).toBeGreaterThan(personalizedNotices[2].RELEVANCE_SCORE);
    });

    it('매칭 이유가 올바르게 설정되어야 한다', () => {
      // Arrange
      const notices: NoticeLegacyDto[] = [mockNotice];

      // Act
      const personalizedNotices = NoticeService.personalizeNotices(notices, mockUserProfile);

      // Assert
      expect(personalizedNotices[0].MATCH_REASONS).toContain('전문과목 일치');
      expect(personalizedNotices[0].MATCH_REASONS).toContain('근무형태 일치');
    });
  });

  describe('calculatePagination', () => {
    
    it('페이징 정보가 올바르게 계산되어야 한다', () => {
      // Act
      const pagination = NoticeService.calculatePagination(150, 2, 20);

      // Assert
      expect(pagination).toEqual({
        total: 150,
        page: 2,
        limit: 20,
        totalPages: 8 // Math.ceil(150/20)
      });
    });

    it('limit이 100을 초과하면 100으로 제한되어야 한다', () => {
      // Act
      const pagination = NoticeService.calculatePagination(1000, 1, 200);

      // Assert
      expect(pagination.limit).toBe(100);
      expect(pagination.totalPages).toBe(10); // Math.ceil(1000/100)
    });

    it('페이지가 0 이하면 1로 보정되어야 한다', () => {
      // Act
      const pagination = NoticeService.calculatePagination(100, 0, 20);

      // Assert
      expect(pagination.page).toBe(1);
    });
  });
});
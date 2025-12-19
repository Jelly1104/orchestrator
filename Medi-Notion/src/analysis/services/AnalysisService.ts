import { MemberTypeDistribution, RegistrationTrend, BasicAnalysisResult, BasicTrigger } from '../types';

export class AnalysisService {
  /**
   * 회원 유형명 매핑 (실제 U_KIND 값 기준)
   */
  static getMemberTypeName(memberType: string): string {
    const typeMap: Record<string, string> = {
      'DOC001': '의사',
      'DOC002': '치과의사', 
      'DOC003': '한의사',
      'PHM001': '약사',
      'NUR001': '간호사'
    };
    return typeMap[memberType] || `기타(${memberType})`;
  }

  /**
   * 회원 유형 분포 데이터 처리
   */
  static processMemberTypeData(rawData: any[]): MemberTypeDistribution[] {
    return rawData.map(row => ({
      memberType: row.MEMBER_TYPE,
      memberTypeName: this.getMemberTypeName(row.MEMBER_TYPE),
      totalCount: parseInt(row.TOTAL_COUNT),
      percentage: parseFloat(row.PERCENTAGE)
    }));
  }

  /**
   * 가입 트렌드 데이터 처리
   */
  static processRegistrationTrend(rawData: any[]): RegistrationTrend[] {
    return rawData.map(row => ({
      month: row.REG_MONTH,
      newMembers: parseInt(row.NEW_MEMBERS)
    }));
  }

  /**
   * 기본 인사이트 생성
   */
  static generateBasicInsights(
    memberTypes: MemberTypeDistribution[],
    totalMembers: number
  ): string[] {
    const doctorData = memberTypes.find(m => m.memberType === 'DOC001');
    const topType = memberTypes[0];

    const insights = [
      `총 활성 회원 ${totalMembers.toLocaleString()}명`,
      `최대 회원군: ${topType.memberTypeName} ${topType.totalCount.toLocaleString()}명 (${topType.percentage}%)`
    ];

    if (doctorData) {
      insights.push(`의사 회원: ${doctorData.totalCount.toLocaleString()}명 (${doctorData.percentage}%)`);
    }

    return insights;
  }

  /**
   * 기본 추천사항 생성 (현실적 범위)
   */
  static generateBasicRecommendations(memberTypes: MemberTypeDistribution[]): string[] {
    const recommendations = [
      '신규 회원 온보딩 프로세스 개선으로 초기 이탈 방지',
      '회원 유형별 맞춤 콘텐츠 추천 시스템 도입'
    ];

    const doctorData = memberTypes.find(m => m.memberType === 'DOC001');
    if (doctorData && doctorData.percentage > 50) {
      recommendations.push('의사 회원 대상 전문 서비스(채용/임대) 집중 마케팅');
    }

    return recommendations;
  }

  /**
   * 기본 Use Case Trigger 생성 (실현 가능한 범위)
   */
  static generateBasicTriggers(memberTypes: MemberTypeDistribution[]): BasicTrigger[] {
    const totalMembers = memberTypes.reduce((sum, m) => sum + m.totalCount, 0);
    
    return [
      {
        triggerName: '신규_회원_온보딩',
        targetSegment: '전체 신규 가입자',
        condition: '가입 후 7일 이내 재방문 시',
        expectedAction: '서비스 가이드 및 인기 콘텐츠 추천',
        estimatedReach: Math.floor(totalMembers * 0.05) // 월 신규 가입자 5% 추정
      },
      {
        triggerName: '회원유형별_콘텐츠_추천',
        targetSegment: 'U_KIND 기반 회원 구분',
        condition: '메인페이지 방문 시',
        expectedAction: '직종별 관련 게시판/서비스 추천',
        estimatedReach: Math.floor(totalMembers * 0.3)
      }
    ];
  }

  /**
   * 종합 분석 결과 생성 (단순화 버전)
   */
  static generateBasicAnalysisResult(
    memberTypes: MemberTypeDistribution[],
    registrationTrend: RegistrationTrend[]
  ): BasicAnalysisResult {
    const totalMembers = memberTypes.reduce((sum, m) => sum + m.totalCount, 0);
    const insights = this.generateBasicInsights(memberTypes, totalMembers);
    const recommendations = this.generateBasicRecommendations(memberTypes);

    return {
      totalMembers,
      activeMembersByType: memberTypes,
      registrationTrend,
      basicInsights: insights,
      simpleRecommendations: recommendations
    };
  }
}
/**
 * Skills Dashboard 타입 정의
 * @description SDD.md 섹션 2.1 기반 타입 정의
 */

/**
 * Skill 상태 타입
 */
export type SkillStatus = "active" | "inactive";

/**
 * Skill 인터페이스
 */
export interface Skill {
  /** Skill 고유 ID */
  id: string;
  /** Skill 이름 (표시용) */
  name: string;
  /** 버전 정보 (v{major}.{minor}.{patch}) */
  version: string;
  /** 활성화 상태 */
  status: SkillStatus;
  /** 설명 텍스트 */
  description: string;
}

/**
 * SkillCard 컴포넌트 Props
 */
export interface SkillCardProps {
  skill: Skill;
}

/**
 * StatusBadge 컴포넌트 Props
 */
export interface StatusBadgeProps {
  status: SkillStatus;
}

/**
 * Skills Dashboard 타입 정의
 * @description SDD.md 섹션 3.1 기반 타입 정의
 */

export type SkillStatus = 'active' | 'inactive';

export interface Skill {
  name: string;
  version: string;
  status: SkillStatus;
  description: string;
}

export interface SkillCardProps {
  skill: Skill;
}

export interface StatusBadgeProps {
  status: SkillStatus;
}

export const SKILLS_DATA: Skill[] = [
  { name: 'leader', version: '1.3.0', status: 'active', description: 'PRD 분석, HANDOFF 생성' },
  { name: 'designer', version: '2.4.0', status: 'active', description: 'IA/Wireframe/SDD 생성' },
  { name: 'coder', version: '1.5.0', status: 'active', description: 'SDD 기반 코드 구현' },
  { name: 'reviewer', version: '1.4.0', status: 'active', description: '품질 검증' },
  { name: 'imleader', version: '1.1.0', status: 'active', description: '구현 검증' },
  { name: 'query', version: '1.2.0', status: 'active', description: 'SQL 쿼리 생성' },
  { name: 'profiler', version: '1.0.0', status: 'inactive', description: '프로필 분석' },
];

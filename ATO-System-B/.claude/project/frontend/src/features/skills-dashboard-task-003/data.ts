import type { Category, Preference, Skill } from "./types";

export const SKILLS: Skill[] = [
  {
    id: "query",
    name: "Query",
    version: "1.3.0",
    status: "active",
    description: "SQL 쿼리 생성 및 데이터 분석",
    category: "Analysis",
  },
  {
    id: "profiler",
    name: "Profiler",
    version: "1.3.0",
    status: "active",
    description: "회원 프로필 분석",
    category: "Analysis",
  },
  {
    id: "designer",
    name: "Designer",
    version: "2.3.0",
    status: "active",
    description: "IA/Wireframe/SDD 설계 문서 생성",
    category: "Design",
  },
  {
    id: "coder",
    name: "Coder",
    version: "1.4.0",
    status: "active",
    description: "SDD 기반 코드 구현",
    category: "Implementation",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    version: "1.3.0",
    status: "active",
    description: "산출물 품질 검증",
    category: "Quality",
  },
];

export const CATEGORIES: Category[] = [
  { id: "analysis", name: "Analysis", description: "데이터/쿼리 중심 스킬" },
  { id: "design", name: "Design", description: "IA, Wireframe, SDD 설계" },
  { id: "implementation", name: "Implementation", description: "프런트/백엔드 코드 구현" },
  { id: "quality", name: "Quality", description: "산출물 검증 및 리뷰" },
];

export const PREFERENCES: Preference[] = [
  {
    key: "notify-status",
    label: "상태 변경 알림",
    description: "Skill 상태(active/inactive) 변경 시 알림 수신",
    enabled: true,
  },
  {
    key: "beta-access",
    label: "베타 스킬 접근",
    description: "미리보기 스킬에 대한 접근 허용",
    enabled: false,
  },
  {
    key: "auto-refresh",
    label: "자동 새로고침",
    description: "대시보드를 5분마다 자동 새로고침",
    enabled: true,
  },
];

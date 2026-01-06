export type SkillStatus = "active" | "inactive";

export interface Skill {
  id: string;
  name: string;
  version: string;
  status: SkillStatus;
  description: string;
  category: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Preference {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface NavItem {
  id: PageView;
  label: string;
}

export type PageView = "overview" | "details" | "categories" | "settings";

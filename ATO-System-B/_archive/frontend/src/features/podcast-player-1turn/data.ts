// data.ts - Fixture 데이터 (Schema-Compliant, TDD_WORKFLOW.md 준수)

import type { ScriptLine, ScriptMetadata } from './types';

/**
 * Mock 대본 데이터
 * - 12개 HOST/GUEST 대화 라인
 * - PII 없음 (HANDOFF.md Phase C Constraints)
 * - SDD.md 4.2 응답 형식 준수
 */
export const MOCK_SCRIPT: ScriptLine[] = [
  {
    speaker: 'HOST',
    text: '안녕하세요, 오늘의 무찌마 베스트를 전해드리는 메디캐스트입니다. 오늘도 흥미로운 이야기들이 많았는데요.',
  },
  {
    speaker: 'GUEST',
    text: '네, 반갑습니다. 오늘 무찌마에서는 특히 의료 현장의 다양한 이야기들이 화제가 됐습니다.',
  },
  {
    speaker: 'HOST',
    text: '첫 번째로 화제가 된 글은 응급실 야간 당직에 관한 이야기입니다. 많은 분들이 공감하셨더라고요.',
  },
  {
    speaker: 'GUEST',
    text: '맞아요, 야간 당직의 고충을 다룬 글인데, 댓글에서도 비슷한 경험을 나누는 분들이 많았습니다.',
  },
  {
    speaker: 'HOST',
    text: '두 번째는 진료실에서 겪은 따뜻한 에피소드였는데요. 환자분과의 소통에 대한 이야기였습니다.',
  },
  {
    speaker: 'GUEST',
    text: '정말 감동적인 사례였죠. 의료인으로서의 보람을 느끼게 해주는 글이었습니다.',
  },
  {
    speaker: 'HOST',
    text: '세 번째 글은 최근 의료 정책 변화에 대한 현장 의견이었습니다. 활발한 토론이 이어졌어요.',
  },
  {
    speaker: 'GUEST',
    text: '네, 다양한 관점에서 의견이 오갔는데, 건설적인 논의가 많았습니다.',
  },
  {
    speaker: 'HOST',
    text: '네 번째는 개원을 준비하시는 분들을 위한 팁 공유 글이었습니다. 실질적인 정보가 담겨있었죠.',
  },
  {
    speaker: 'GUEST',
    text: '경험자분들의 노하우가 담겨있어서 많은 분들이 도움이 됐다고 하셨어요.',
  },
  {
    speaker: 'HOST',
    text: '마지막으로 다섯 번째는 의료인의 워라밸에 대한 솔직한 이야기였습니다.',
  },
  {
    speaker: 'GUEST',
    text: '오늘의 베스트는 여기까지입니다. 내일도 새로운 소식으로 찾아뵙겠습니다. 감사합니다!',
  },
];

/**
 * Mock 메타데이터
 * - SDD.md 4.2 응답 형식 준수
 */
const today = new Date().toISOString().split('T')[0];

export const MOCK_METADATA: ScriptMetadata = {
  generatedAt: `${today}T06:00:00.000Z`,
  wordCount: 450,
  estimatedDuration: '약 3분',
};

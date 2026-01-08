// data.ts - Fixture 데이터 (SDD.md 명세 준수, Phase A 분석 결과 기반)

import type { ScriptLine, ScriptMetadata } from './types';

// 오늘 날짜 포맷
const today = new Date().toISOString().split('T')[0];

// 팟캐스트 대본 Fixture (Phase A 분석 결과 기반, PII 마스킹 적용)
export const MOCK_SCRIPT: ScriptLine[] = [
  {
    speaker: 'HOST',
    text: '안녕하세요, 오늘의 무찌마 베스트를 전해드리는 호스트입니다. 바쁜 선생님들을 위해 3분만에 핵심만 전달해 드릴게요.',
  },
  {
    speaker: 'GUEST',
    text: '네, 오늘도 핫한 게시물들이 많았네요. 커뮤니티에서 가장 화제가 된 이야기들을 함께 살펴보겠습니다.',
  },
  {
    speaker: 'HOST',
    text: '첫 번째 인기 게시물은 의료 현장의 어려움에 관한 이야기입니다. 많은 선생님들이 공감해 주셨는데요.',
  },
  {
    speaker: 'GUEST',
    text: '환자분들과의 소통에서 겪는 어려움을 솔직하게 털어놓은 글이었습니다. 진료 현장에서의 피로감이 느껴지더라고요.',
  },
  {
    speaker: 'HOST',
    text: '두 번째 주제는 의료계 이슈에 관한 토론이었습니다. 다양한 의견이 오갔는데요.',
  },
  {
    speaker: 'GUEST',
    text: '열띤 토론이 벌어졌습니다. 서로 다른 관점에서 의견을 나누는 모습이 인상적이었어요.',
  },
  {
    speaker: 'HOST',
    text: '세 번째는 삶에 대한 단상을 담은 글입니다. 일상 속 작은 깨달음을 나눈 이야기였어요.',
  },
  {
    speaker: 'GUEST',
    text: '나이가 들면서 느끼는 감정들, 많은 분들이 공감하셨을 것 같습니다.',
  },
  {
    speaker: 'HOST',
    text: '마지막으로 진료 현장에서의 에피소드가 화제였습니다. 웃픈 상황들이 담겨있었네요.',
  },
  {
    speaker: 'GUEST',
    text: '의료인이라면 누구나 공감할 만한 이야기였습니다. 힘든 하루를 보내시는 선생님들께 위로가 되었으면 합니다.',
  },
  {
    speaker: 'HOST',
    text: '오늘도 바쁜 하루를 보내시는 선생님들께 작은 휴식이 되었길 바랍니다.',
  },
  {
    speaker: 'GUEST',
    text: '내일도 더 좋은 이야기로 찾아뵙겠습니다. 무찌마 일간 베스트였습니다.',
  },
];

// 메타데이터 Fixture
export const MOCK_METADATA: ScriptMetadata = {
  generatedAt: `${today}T06:00:00.000Z`,
  wordCount: 450,
  estimatedDuration: '약 3분',
};

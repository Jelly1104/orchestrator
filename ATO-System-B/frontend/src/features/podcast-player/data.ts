// data.ts - Fixture 데이터 (SDD.md 명세 준수, DOMAIN_SCHEMA.md 컬럼명 사용)

import type { BestPost, PodcastScript, Topic } from './types';

// 오늘 날짜 포맷
const today = new Date().toISOString().split('T')[0];

// 베스트 게시물 Fixture (Phase A 분석 결과 기반)
export const MOCK_BEST_POSTS: BestPost[] = [
  {
    BOARD_IDX: 3676349,
    TITLE: '의료분쟁 경험담.. 이나라 바이탈은 천천히 죽어갈겁니다..',
    engagement_score: 513,
    comment_count: 171,
  },
  {
    BOARD_IDX: 3677974,
    TITLE: '정말 다 그만두고 싶은 하루...',
    engagement_score: 330,
    comment_count: 92,
  },
  {
    BOARD_IDX: 3677128,
    TITLE: '30~40대 환자들이 점점 늘어나는 것 같습니다',
    engagement_score: 282,
    comment_count: 78,
  },
  {
    BOARD_IDX: 3675931,
    TITLE: '살면서 느낀점',
    engagement_score: 264,
    comment_count: 64,
  },
  {
    BOARD_IDX: 3677144,
    TITLE: '모텔을 갔다는 게 문제가 아니라...',
    engagement_score: 252,
    comment_count: 84,
  },
];

// 팟캐스트 대본 토픽 Fixture (PII 마스킹 적용)
const MOCK_TOPICS: Topic[] = [
  {
    id: 1,
    title: '의료 현장의 어려움',
    host_comment: '안녕하세요, 오늘의 무찌마 일간 베스트입니다. 바쁜 선생님들을 위해 3분 만에 핵심만 전달해 드릴게요. 첫 번째 주제는 의료분쟁에 관한 경험담인데요, 많은 선생님들이 공감해 주셨습니다.',
    guest_comment: '네, 정말 공감되는 내용이었습니다. 어느 [병원명]의 내과 과장 선생님께서 겪으신 이야기인데, 최선을 다했음에도 불구하고 분쟁으로 이어진 안타까운 사연이었습니다.',
  },
  {
    id: 2,
    title: '번아웃과 회복',
    host_comment: '두 번째 주제는 번아웃에 관한 이야기입니다. 정말 다 그만두고 싶다는 솔직한 고백이 담긴 글이었는데요.',
    guest_comment: '많은 선생님들이 위로와 공감의 댓글을 남겨주셨어요. 힘든 시간을 보내고 계신 분들께 작은 위로가 되었으면 합니다.',
  },
  {
    id: 3,
    title: '환자 연령대 변화',
    host_comment: '세 번째는 30~40대 환자분들이 늘어나고 있다는 관찰인데요, 현장에서 체감하시는 분들이 많으신 것 같습니다.',
    guest_comment: '건강에 대한 관심이 높아지면서 젊은 연령대의 검진이 늘어난 것도 원인 중 하나로 보입니다.',
  },
  {
    id: 4,
    title: '삶에 대한 단상',
    host_comment: '네 번째는 삶에 대한 따뜻한 글이었습니다. 소박하지만 진정한 행복의 의미를 되새기게 하는 내용이었어요.',
    guest_comment: '잠잘 곳, 출근할 곳, 함께할 사람이 있으면 행복하다는 메시지가 많은 분들의 공감을 얻었습니다.',
  },
  {
    id: 5,
    title: '오늘의 마무리',
    host_comment: '마지막 주제까지 함께 해주셨습니다. 오늘도 바쁜 하루를 보내시는 선생님들께 작은 휴식이 되었길 바랍니다.',
    guest_comment: '네, 내일도 더 좋은 이야기로 찾아뵙겠습니다. 무찌마 일간 베스트였습니다.',
  },
];

// 팟캐스트 대본 Fixture
export const MOCK_PODCAST_SCRIPT: PodcastScript = {
  date: today,
  duration: 180, // 3분 (초 단위)
  topics: MOCK_TOPICS,
};

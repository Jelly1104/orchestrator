// data.ts - 정적 데이터 (분석 결과 기반)
import { AnalysisData, PodcastScript } from './types';

// 분석 결과 데이터 (analysis_report.md 기반)
export const ANALYSIS_DATA: AnalysisData = {
  posts: [
    {
      boardIdx: 3679154,
      title: "한국 떠나고싶다",
      readCnt: 0,
      agreeCnt: 19,
      commentCount: 8,
      popularityScore: 19,
      summary: "의사 번아웃, 환자 스트레스, 해외 이민 고민",
      sentiment: "부정적/고백적",
      suitability: "high"
    },
    {
      boardIdx: 3679134,
      title: "손종원이 누구냐고?",
      readCnt: 0,
      agreeCnt: 13,
      commentCount: 12,
      popularityScore: 13,
      summary: "미슐랭 스타쉐프 손종원 소개",
      sentiment: "정보성/감탄",
      suitability: "medium"
    },
    {
      boardIdx: 3679128,
      title: "직원들 꼴보기 싫다",
      readCnt: 0,
      agreeCnt: 12,
      commentCount: 9,
      popularityScore: 12,
      summary: "병원 직원 관리 스트레스, 호의의 권리화",
      sentiment: "분노/하소연",
      suitability: "high"
    },
    {
      boardIdx: 3679137,
      title: "지금 2-30대 젊은 의사들 분위기",
      readCnt: 0,
      agreeCnt: 9,
      commentCount: 11,
      popularityScore: 9,
      summary: "자산 vs 노동 격차, 젊은 의사들의 고민",
      sentiment: "분석적/우려",
      suitability: "high"
    },
    {
      boardIdx: 3679143,
      title: "시진핑 만난 사람들 다 제거되었다네",
      readCnt: 0,
      agreeCnt: 9,
      commentCount: 0,
      popularityScore: 9,
      summary: "시사/정치 관련 이미지 게시물",
      sentiment: "정보성",
      suitability: "low"
    }
  ],
  trendKeywords: ["번아웃", "이민", "직원 관리", "세대론"],
  generatedAt: "2026-01-07T00:00:00Z"
};

// 생성된 팟캐스트 대본 데이터
export const PODCAST_SCRIPT: PodcastScript = {
  episodeId: "260107",
  createdAt: "2026-01-07",
  totalDuration: 180,
  wordCount: 480,
  sections: [
    {
      id: "intro",
      type: "intro",
      title: "오프닝",
      duration: 30,
      dialogues: [
        {
          speaker: "host",
          text: "안녕하세요, 오늘의 무찌마 핫토픽입니다!",
          startTime: 0
        },
        {
          speaker: "guest",
          text: "안녕하세요! 오늘도 재미있는 이야기 나눠볼게요.",
          startTime: 5
        },
        {
          speaker: "host",
          text: "오늘은 '한국 떠나고 싶다'는 고백부터 직원 관리 스트레스까지, 의사 선생님들의 솔직한 이야기를 준비했습니다.",
          startTime: 10
        }
      ]
    },
    {
      id: "main1",
      type: "main",
      title: "한국 떠나고싶다",
      duration: 45,
      dialogues: [
        {
          speaker: "host",
          text: "첫 번째 화제입니다. 공감 19개를 받은 글인데요, '한국 떠나고 싶다'는 제목의 글이에요.",
          startTime: 30
        },
        {
          speaker: "guest",
          text: "맞아요, 정말 많은 분들이 공감하셨네요. 진료실에서의 스트레스, 환자분들과의 갈등... 번아웃을 호소하시는 내용이었어요.",
          startTime: 40
        },
        {
          speaker: "host",
          text: "해외 이민까지 고민하시는 분들이 많더라고요. 선생님들의 마음이 참 무겁습니다.",
          startTime: 55
        },
        {
          speaker: "guest",
          text: "그래도 댓글에서 서로 위로하고 공감해주시는 모습이 인상적이었어요. 혼자가 아니라는 거죠.",
          startTime: 65
        }
      ]
    },
    {
      id: "main2",
      type: "main",
      title: "직원 관리 스트레스",
      duration: 45,
      dialogues: [
        {
          speaker: "host",
          text: "두 번째 화제는 개원의 선생님들이 공감하실 내용입니다. '직원들 때문에 힘들다'는 글이에요.",
          startTime: 75
        },
        {
          speaker: "guest",
          text: "호의가 권리가 되는 순간, 참 힘들죠. 경계 설정의 중요성을 많이들 이야기하셨어요.",
          startTime: 85
        },
        {
          speaker: "host",
          text: "댓글에서 경험 공유도 많았고, 나름의 해결책들도 있었는데요.",
          startTime: 95
        },
        {
          speaker: "guest",
          text: "규칙을 명확히 하고, 초반에 라인을 잘 세우는 게 중요하다는 조언이 많았습니다.",
          startTime: 105
        }
      ]
    },
    {
      id: "main3",
      type: "main",
      title: "손종원 쉐프",
      duration: 30,
      dialogues: [
        {
          speaker: "host",
          text: "분위기 전환! 손종원 쉐프 아세요?",
          startTime: 120
        },
        {
          speaker: "guest",
          text: "미슐랭 스타 쉐프요! 의사 커뮤니티에서도 화제더라고요. 성공 스토리가 인상적이었어요.",
          startTime: 125
        },
        {
          speaker: "host",
          text: "가끔은 이런 가벼운 이야기도 좋죠. 다양한 분야의 이야기를 나누는 것도 무찌마의 매력이에요.",
          startTime: 135
        }
      ]
    },
    {
      id: "outro",
      type: "outro",
      title: "마무리",
      duration: 30,
      dialogues: [
        {
          speaker: "host",
          text: "오늘 이야기 어떠셨나요?",
          startTime: 150
        },
        {
          speaker: "guest",
          text: "젊은 의사들의 자산 고민도 화제였는데, 자세한 내용은 무찌마에서 확인해보세요!",
          startTime: 155
        },
        {
          speaker: "host",
          text: "다음 시간에 또 만나요! 구독과 좋아요 부탁드립니다.",
          startTime: 165
        }
      ]
    }
  ]
};

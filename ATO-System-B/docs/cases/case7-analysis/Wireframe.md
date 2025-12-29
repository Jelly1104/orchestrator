# Wireframe.md - 화면 설계

## 관리자 대시보드

### 메인 대시보드
```
┌─────────────────────────────────────────────┐
│ 메디게이트 팟캐스트 관리 시스템              │
├─────────────────────────────────────────────┤
│ [생성 시작] [설정] [기록 보기]               │
├─────────────────────────────────────────────┤
│ ■ 오늘의 상태                               │
│   최종 생성: 2024-01-15 06:00               │
│   처리 게시물: 5건                          │
│   대본 길이: 8분 30초                       │
│                                             │
│ ■ 베스트 게시물 (Phase A)                   │
│ ┌─────┬──────────┬─────┬─────┬─────┐      │
│ │순위 │제목      │조회 │댓글 │점수 │      │
│ ├─────┼──────────┼─────┼─────┼─────┤      │
│ │1    │응급실... │1.2K │45   │95   │      │
│ │2    │수술실... │980  │38   │87   │      │
│ │3    │외래진료..│850  │52   │85   │      │
│ └─────┴──────────┴─────┴─────┴─────┘      │
│                                             │
│ ■ 대본 생성 진행률                          │
│ Phase A ████████████ 100%                   │
│ Phase B ████████░░░░  67%                   │
└─────────────────────────────────────────────┘
```

### 대본 편집 화면
```
┌─────────────────────────────────────────────┐
│ 팟캐스트 대본 편집 - 2024-01-15             │
├─────────────────────────────────────────────┤
│ [저장] [TTS 미리보기] [메타데이터 편집]     │
├─────────────────────────────────────────────┤
│ ■ 대본 내용                                 │
│                                             │
│ [HOST] 안녕하세요, 메디게이트 데일리        │
│        브리핑의 김진수입니다. 오늘도        │
│        의료 현장의 생생한 이야기를...       │
│        {감정: 밝음, 속도: 보통}             │
│                                             │
│ [GUEST] 네, 안녕하세요. 응급의학과          │
│         이현정입니다. 어제 응급실에서       │
│         정말 인상적인 케이스가...           │
│         {감정: 진지함, 강조: 케이스}        │
│                                             │
│ ■ 메타데이터 패널 (우측)                    │
│ ┌─────────────────────────┐                │
│ │ 총 길이: 8분 30초       │                │
│ │ Host 발화: 4분 12초     │                │
│ │ Guest 발화: 4분 18초    │                │
│ │                        │                │
│ │ 주요 키워드:           │                │
│ │ • 응급실 (5회)         │                │
│ │ • 수술 (3회)           │                │
│ │ • 환자안전 (2회)       │                │
│ └─────────────────────────┘                │
└─────────────────────────────────────────────┘
```

## API 응답 구조

### 베스트 게시물 추출 API 응답
```json
{
  "status": "success",
  "data": {
    "extraction_date": "2024-01-15",
    "posts": [
      {
        "board_idx": 123456,
        "title": "응급실에서 만난 특별한 환자",
        "content_preview": "어제 야간 근무 중...",
        "read_cnt": 1250,
        "comment_cnt": 45,
        "score": 95,
        "category": "임상경험",
        "pii_detected": ["병원명", "의사명"]
      }
    ],
    "metadata": {
      "total_candidates": 150,
      "selected_count": 5,
      "processing_time": "2.3초"
    }
  }
}
```

### 대본 생성 API 응답
```json
{
  "status": "success",
  "data": {
    "script_id": "daily-20240115",
    "total_duration": "8분 30초",
    "segments": [
      {
        "speaker": "HOST",
        "text": "안녕하세요, 메디게이트 데일리 브리핑의...",
        "metadata": {
          "emotion": "밝음",
          "speed": "보통",
          "emphasis": [],
          "pause_after": 1.0
        }
      },
      {
        "speaker": "GUEST", 
        "text": "네, 안녕하세요. 응급의학과 이현정입니다...",
        "metadata": {
          "emotion": "진지함",
          "speed": "보통",
          "emphasis": ["케이스"],
          "pause_after": 0.5
        }
      }
    ]
  }
}
```

## 컴포넌트 매핑

### React 컴포넌트 구조
```
PodcastDashboard/
├── DashboardHeader
├── StatusPanel
│   ├── GenerationStatus
│   └── ProgressIndicator
├── BestPostsTable
│   ├── PostRow
│   └── ScoreIndicator
├── ScriptEditor
│   ├── SegmentEditor
│   ├── MetadataPanel
│   └── TTSPreview
└── SettingsModal
    ├── CharacterSettings
    └── GenerationSettings
```

### 상태 관리 (Redux Store)
```javascript
{
  podcast: {
    dailyBriefing: {
      status: 'generating' | 'completed' | 'error',
      bestPosts: PostData[],
      script: ScriptSegment[],
      metadata: PodcastMetadata
    },
    settings: {
      hostCharacter: CharacterProfile,
      guestCharacter: CharacterProfile,
      generationOptions: GenerationConfig
    }
  }
}
```
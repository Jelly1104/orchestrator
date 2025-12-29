import { BestPost, GenerationOptions, PodcastScript, ScriptSegment, PodcastMetadata } from '../types/podcast.types';

export class PodcastScriptGenerator {
  private characterProfiles = {
    professional: {
      description: '전문적이고 신뢰감 있는 진행자',
      speechStyle: '정확하고 명확한 표현, 적절한 의료 용어 사용'
    },
    friendly: {
      description: '친근하고 접근하기 쉬운 진행자',
      speechStyle: '편안하고 따뜻한 말투, 쉬운 설명'
    },
    analytical: {
      description: '분석적이고 논리적인 진행자',
      speechStyle: '체계적인 접근, 데이터 기반 설명'
    },
    experienced: {
      description: '경험이 풍부한 현장 전문가',
      speechStyle: '실무 중심의 조언, 사례 기반 설명'
    },
    junior: {
      description: '젊고 열정적인 전문가',
      speechStyle: '호기심 많고 적극적인 질문, 배우는 자세'
    },
    specialist: {
      description: '특정 분야의 전문가',
      speechStyle: '깊이 있는 전문 지식, 학술적 접근'
    }
  };

  async generateScript(posts: BestPost[], options: GenerationOptions): Promise<PodcastScript> {
    const hostProfile = this.characterProfiles[options.host_character];
    const guestProfile = this.characterProfiles[options.guest_character];

    // 실제 LLM 호출 대신 구조화된 대본 생성 (PoC용)
    const segments = this.generateStructuredScript(posts, hostProfile, guestProfile, options);
    
    // 메타데이터 생성
    const metadata = this.generateMetadata(segments);

    const scriptId = `daily-${new Date().toISOString().split('T')[0]}`;

    return {
      script_id: scriptId,
      total_duration: metadata.total_duration,
      segments,
      metadata
    };
  }

  private generateStructuredScript(
    posts: BestPost[], 
    hostProfile: any, 
    guestProfile: any, 
    options: GenerationOptions
  ): ScriptSegment[] {
    const segments: ScriptSegment[] = [];

    // 1. 오프닝 (1분)
    segments.push({
      speaker: 'HOST',
      text: '안녕하세요, 메디게이트 데일리 브리핑의 진행자입니다. 오늘도 의료 현장의 생생한 이야기를 전해드리겠습니다.',
      metadata: {
        emotion: '밝음',
        speed: '보통',
        emphasis: ['메디게이트', '데일리 브리핑'],
        pause_after: 1.0
      }
    });

    segments.push({
      speaker: 'GUEST',
      text: '네, 안녕하세요. 오늘 함께하게 되어 반갑습니다. 어제 의료 커뮤니티에서 화제가 된 이슈들을 살펴보겠습니다.',
      metadata: {
        emotion: '진지함',
        speed: '보통',
        emphasis: ['화제', '이슈들'],
        pause_after: 0.5
      }
    });

    // 2. 주요 이슈 소개 (2분)
    posts.forEach((post, index) => {
      if (index < 3) { // 상위 3개만 상세 다룸
        segments.push({
          speaker: 'HOST',
          text: `${index + 1}번째로 소개할 이야기는 "${post.title}"입니다. 조회수 ${post.read_cnt}회, 댓글 ${post.comment_cnt}개로 많은 관심을 받았네요.`,
          metadata: {
            emotion: '밝음',
            speed: '보통',
            emphasis: [post.title, `${post.read_cnt}회`, `${post.comment_cnt}개`],
            pause_after: 0.5
          }
        });

        segments.push({
          speaker: 'GUEST',
          text: `이 이야기의 핵심은... ${post.content_preview.substring(0, 100)}... 현장에서 자주 경험하는 상황이죠. 특히 주목할 점은...`,
          metadata: {
            emotion: '진지함',
            speed: '보통',
            emphasis: ['핵심', '현장', '주목할 점'],
            pause_after: 1.0
          }
        });
      }
    });

    // 3. 마무리 (1분)
    segments.push({
      speaker: 'HOST',
      text: '오늘 소개한 이야기들을 통해 의료 현장의 다양한 경험과 고민을 함께 나눌 수 있었습니다. 다음에도 유익한 내용으로 찾아뵙겠습니다.',
      metadata: {
        emotion: '밝음',
        speed: '보통',
        emphasis: ['의료 현장', '경험과 고민', '유익한 내용'],
        pause_after: 1.0
      }
    });

    segments.push({
      speaker: 'GUEST',
      text: '네, 감사합니다. 의료진 여러분들의 소중한 경험이 더 많은 분들에게 도움이 되길 바랍니다. 안녕히 계세요.',
      metadata: {
        emotion: '진지함',
        speed: '느림',
        emphasis: ['소중한 경험', '도움'],
        pause_after: 2.0
      }
    });

    return segments;
  }

  private generateMetadata(segments: ScriptSegment[]): PodcastMetadata {
    let totalDuration = 0;
    let hostDuration = 0;
    let guestDuration = 0;
    const keywords = new Map<string, number>();

    segments.forEach(segment => {
      // 발화 시간 추정 (한국어 기준: 분당 300자)
      const duration = segment.text.length / 300 * 60;
      totalDuration += duration;

      if (segment.speaker === 'HOST') {
        hostDuration += duration;
      } else {
        guestDuration += duration;
      }

      // 키워드 추출
      const words = segment.text.match(/[가-힣]{2,}/g) || [];
      words.forEach(word => {
        if (word.length >= 2) {
          keywords.set(word, (keywords.get(word) || 0) + 1);
        }
      });
    });

    const topKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      total_duration: `${Math.floor(totalDuration / 60)}분 ${Math.floor(totalDuration % 60)}초`,
      host_duration: `${Math.floor(hostDuration / 60)}분 ${Math.floor(hostDuration % 60)}초`,
      guest_duration: `${Math.floor(guestDuration / 60)}분 ${Math.floor(guestDuration % 60)}초`,
      top_keywords: topKeywords
    };
  }
}
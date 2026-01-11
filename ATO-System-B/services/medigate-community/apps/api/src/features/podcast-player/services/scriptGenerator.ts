import { RawDataSummary, PodcastSegment, AudioMetadata } from '../types';

export class PodcastScriptGenerator {
  private readonly SCRIPT_TEMPLATE = `# 메디캐스트 일간 브리핑 - {date}

## [00:00] 인트로
**Host**: 안녕하세요, 메디게이트 일간 브리핑입니다. 오늘은 {date} 무찌마에서 가장 화제가 된 이야기들을 살펴보겠습니다.

**Guest**: 네, 반갑습니다. 오늘도 흥미로운 주제들이 많이 올라왔네요.

{segments}

## [08:30] 마무리
**Host**: 오늘의 브리핑은 여기까지입니다. 내일도 새로운 소식으로 찾아뵙겠습니다.
**Guest**: 감사합니다. 유익한 시간이었습니다.

---
*총 재생시간: 약 9분*
*생성일시: {timestamp}*
`;

  generateScript(rawData: RawDataSummary): string {
    const segments: string[] = [];
    let currentTimestamp = 30; // 30초부터 시작

    rawData.best_posts.forEach((post, index) => {
      const segmentNumber = index + 1;
      const minutes = Math.floor(currentTimestamp / 60);
      const seconds = currentTimestamp % 60;
      const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      const segment = `## [${timeString}] 베스트 게시물 #${segmentNumber}
**Host**: ${segmentNumber}번째로 화제가 된 글을 살펴보겠습니다. "${post.title}"라는 제목으로 올라온 글인데요.

**Guest**: 네, 이 글이 ${post.engagement_score}점의 높은 참여도를 기록했군요. ${post.summary.substring(0, 100)}...

**Host**: 정말 흥미로운 내용이네요. 이런 주제는 의료진들 사이에서 어떤 반응을 보이나요?

**Guest**: 보통 이런 경우에는...`;

      segments.push(segment);
      currentTimestamp += 90; // 각 세그먼트 90초
    });

    return this.SCRIPT_TEMPLATE
      .replace(/{date}/g, rawData.extraction_date)
      .replace('{segments}', segments.join('\n\n'))
      .replace('{timestamp}', new Date().toISOString());
  }

  generateMetadata(script: string): AudioMetadata {
    const segments = this.parseSegments(script);
    const totalDuration = this.estimateDuration(script);

    return {
      audio_config: {
        voice: "ko-KR-Neural-Standard-C",
        speaking_rate: 1.0,
        pitch: 0.0,
        volume_gain_db: 0.0
      },
      segments,
      total_estimated_duration: totalDuration,
      emotion_tags: {
        intro: "professional",
        discussion: "engaging",
        analysis: "thoughtful",
        conclusion: "warm"
      }
    };
  }

  private parseSegments(script: string): PodcastSegment[] {
    const lines = script.split('\n');
    const segments: PodcastSegment[] = [];
    let currentTimestamp = '';
    
    for (const line of lines) {
      const timeMatch = line.match(/\[(\d{2}:\d{2})\]/);
      if (timeMatch) {
        currentTimestamp = timeMatch[1];
        continue;
      }
      
      const speakerMatch = line.match(/\*\*(Host|Guest)\*\*:\s*(.+)/);
      if (speakerMatch && currentTimestamp) {
        segments.push({
          timestamp: currentTimestamp,
          speaker: speakerMatch[1] as 'Host' | 'Guest',
          content: speakerMatch[2],
          duration_seconds: this.estimateLineDuration(speakerMatch[2])
        });
      }
    }
    
    return segments;
  }

  private estimateDuration(script: string): number {
    // 한국어 기준: 분당 약 200자
    const textLength = script.replace(/[^가-힣a-zA-Z0-9\s]/g, '').length;
    return Math.round((textLength / 200) * 60);
  }

  private estimateLineDuration(text: string): number {
    return Math.round((text.length / 200) * 60);
  }
}
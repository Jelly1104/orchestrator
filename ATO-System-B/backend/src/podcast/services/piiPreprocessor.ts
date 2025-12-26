import { BestPostData, RawDataSummary } from '../types';

export class PIIPreprocessor {
  private patterns = {
    name: /[가-힣]{2,4}(선생님?|교수님?|원장님?|님)/g,
    hospital: /[가-힣]+병원|[가-힣]+의원|[가-힣]+클리닉/g,
    phone: /\d{3}-\d{4}-\d{4}|\d{3}-\d{3,4}-\d{4}/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    license: /의사면허\s*번호\s*:?\s*\d+/g,
  };

  maskContent(text: string): string {
    let maskedText = text;
    
    // 3단계 마스킹 처리
    maskedText = maskedText.replace(this.patterns.name, 'H** 선생님');
    maskedText = maskedText.replace(this.patterns.hospital, '**병원');
    maskedText = maskedText.replace(this.patterns.phone, '***-****-****');
    maskedText = maskedText.replace(this.patterns.email, '***@***.***');
    maskedText = maskedText.replace(this.patterns.license, '면허번호: [마스킹]');

    return maskedText;
  }

  generateSummary(text: string, maxLength: number = 200): string {
    const masked = this.maskContent(text);
    if (masked.length <= maxLength) {
      return masked;
    }
    
    // 문장 단위로 자르기
    const sentences = masked.split(/[.!?]/);
    let summary = '';
    
    for (const sentence of sentences) {
      if ((summary + sentence).length > maxLength) break;
      summary += sentence + '.';
    }
    
    return summary.trim();
  }

  async processRawData(posts: BestPostData[], date: string): Promise<RawDataSummary> {
    const processedPosts = posts.map(post => ({
      board_idx: post.BOARD_IDX,
      title: this.maskContent(post.TITLE),
      summary: this.generateSummary(post.CONTENT),
      engagement_score: post.engagement_score,
      masked_content: this.maskContent(post.CONTENT)
    }));

    return {
      extraction_date: date,
      best_posts: processedPosts,
      total_posts: posts.length,
      extraction_criteria: '조회수 + (댓글수 × 3) + (추천수 × 2) 가중치 기준'
    };
  }
}
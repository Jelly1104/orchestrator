export class PIIProcessor {
  private readonly patterns = {
    phone: /\d{2,3}-\d{3,4}-\d{4}/g,
    email: /[\w\.-]+@[\w\.-]+\.\w+/g,
    hospital: /[가-힣]+병원|[가-힣]+의원|[가-힣]+클리닉/g,
    doctorName: /[가-힣]{2,3}\s*선생님?|Dr\.\s*[가-힣]{2,3}/g,
    // 추가 패턴: 면허번호, 주민번호 패턴 감지
    licenseNumber: /[A-Z]{2,3}\d{4,6}/g,
    residentNumber: /\d{6}-\d{7}/g
  };

  async maskSensitiveData(text: string): Promise<string> {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return text || '';
    }

    let maskedText = text;

    try {
      // 주민번호는 완전 제거 (의료법 위반 방지)
      maskedText = maskedText.replace(this.patterns.residentNumber, '[개인정보 삭제]');
      
      // 면허번호 마스킹
      maskedText = maskedText.replace(this.patterns.licenseNumber, '[면허번호 삭제]');

      // 병원명 → A병원, B의원 변환
      maskedText = this.maskHospitalNames(maskedText);

      // 의사명 → 김○○ 선생님 마스킹
      maskedText = this.maskDoctorNames(maskedText);

      // 연락처, 이메일 완전 제거
      maskedText = maskedText.replace(this.patterns.phone, '[연락처 삭제]');
      maskedText = maskedText.replace(this.patterns.email, '[이메일 삭제]');

      return maskedText;
    } catch (error) {
      console.error('[PIIProcessor] 마스킹 처리 중 오류:', error);
      // 마스킹 실패 시 안전하게 빈 문자열 반환
      return '[내용 처리 불가]';
    }
  }

  private maskHospitalNames(text: string): string {
    const hospitals = text.match(this.patterns.hospital) || [];
    const uniqueHospitals = [...new Set(hospitals)];
    
    let maskedText = text;
    uniqueHospitals.forEach((hospital, index) => {
      const replacement = hospital.includes('병원') 
        ? `${String.fromCharCode(65 + index % 26)}병원`
        : hospital.includes('의원')
        ? `${String.fromCharCode(65 + index % 26)}의원`
        : `${String.fromCharCode(65 + index % 26)}클리닉`;
      
      maskedText = maskedText.replace(
        new RegExp(this.escapeRegExp(hospital), 'g'), 
        replacement
      );
    });
    
    return maskedText;
  }

  private maskDoctorNames(text: string): string {
    const doctors = text.match(this.patterns.doctorName) || [];
    const uniqueDoctors = [...new Set(doctors)];
    
    let maskedText = text;
    uniqueDoctors.forEach(doctor => {
      const name = doctor.replace(/[선생님Dr\.\s]/g, '');
      if (name.length >= 2) {
        const maskedName = `${name[0]}${'○'.repeat(name.length - 1)} 선생님`;
        maskedText = maskedText.replace(
          new RegExp(this.escapeRegExp(doctor), 'g'), 
          maskedName
        );
      }
    });
    
    return maskedText;
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  detectPIITypes(text: string): string[] {
    if (!text || typeof text !== 'string') return [];

    const detected: string[] = [];

    try {
      if (this.patterns.residentNumber.test(text)) {
        detected.push('주민번호');
      }
      if (this.patterns.licenseNumber.test(text)) {
        detected.push('면허번호');
      }
      if (this.patterns.hospital.test(text)) {
        detected.push('병원명');
      }
      if (this.patterns.doctorName.test(text)) {
        detected.push('의사명');
      }
      if (this.patterns.phone.test(text)) {
        detected.push('연락처');
      }
      if (this.patterns.email.test(text)) {
        detected.push('이메일');
      }
    } catch (error) {
      console.error('[PIIProcessor] PII 탐지 중 오류:', error);
    }

    return detected;
  }
}
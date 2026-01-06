# QUALITY_RULES.md

> **템플릿 버전**: 1.0.0
> **최종 업데이트**: 2026-01-06
> **목적**: Reviewer/ImLeader 산출물 품질 검증 규칙

---

## 검증 유형별 체크리스트

### 1. 설계 산출물 (IA, Wireframe, SDD)

| 항목 | 검증 내용 | 심각도 |
|------|-----------|--------|
| 필수 섹션 | 템플릿 필수 섹션 모두 포함 | HIGH |
| PRD 매칭 | 요구사항 충족률 ≥ 80% | HIGH |
| Cross-ref | IA → Wireframe → SDD 정합성 | MEDIUM |
| 스키마 준수 | DOMAIN_SCHEMA.md 컬럼명 정확 | HIGH |

### 2. 코드 산출물 (정적 검증)

| 항목 | 검증 내용 | 심각도 |
|------|-----------|--------|
| 파일 존재 | SDD에 명시된 파일 모두 생성 | HIGH |
| 타입 정의 | TypeScript 타입 정확성 | HIGH |
| SDD 정합성 | SDD 명세 ↔ 코드 일치 | HIGH |
| 스타일 | TailwindCSS 클래스 사용 (inline style 금지) | MEDIUM |

### 3. 코드 산출물 (동적 검증) ⚠️ 필수

> **v1.0.0 추가**: 정적 검증만으로 PASS 판정 금지

| 항목 | 검증 내용 | 명령어 | 심각도 |
|------|-----------|--------|--------|
| **빌드 테스트** | TypeScript 컴파일 성공 | `npm run build` 또는 `tsc --noEmit` | HIGH |
| **엔트리포인트 연결** | main.tsx에서 import 확인 | 파일 읽기 검증 | HIGH |
| **구동 테스트** | 개발 서버 실행 및 렌더링 | `npm run dev` (선택) | MEDIUM |

---

## E2E 검증 체크리스트 (v1.0.0 추가)

> 코드 산출물 최종 검증 시 반드시 확인해야 하는 항목

### 필수 (MUST)

- [ ] 모든 파일 존재 확인
- [ ] TypeScript 타입 정확성 (`tsc --noEmit` PASS)
- [ ] **빌드 성공** (`npm run build` PASS)
- [ ] **엔트리포인트 연결** (main.tsx에서 컴포넌트 import)

### 권장 (SHOULD)

- [ ] 구동 테스트 (`npm run dev` 실행 후 렌더링 확인)
- [ ] TailwindCSS 클래스 사용 (inline style 없음)
- [ ] 테스트 코드 포함 (커버리지 ≥ 80%)

### 선택 (MAY)

- [ ] 접근성 검증 (a11y)
- [ ] 반응형 레이아웃 확인
- [ ] 브라우저 호환성

---

## PASS/FAIL 판정 기준

### PASS 조건 (모두 충족)

```yaml
전체 점수: ≥ 80점
HIGH 이슈: 0개
PRD 매칭률: ≥ 80%
빌드 테스트: PASS (코드 산출물인 경우)
엔트리포인트 연결: 확인됨 (코드 산출물인 경우)
```

### FAIL 조건 (하나라도 해당)

```yaml
전체 점수: < 80점
HIGH 이슈: 1개 이상
PRD 매칭률: < 80%
빌드 테스트: FAIL (코드 산출물인 경우)
엔트리포인트 미연결 (코드 산출물인 경우)
```

---

## 검증 결과 보고 형식

```markdown
## 검증 결과: {feature-name}

### 판정: [PASS / FAIL]

### 점수
- 전체: {n}/100
- Syntax: {n}/100
- Semantic: {n}/100
- PRD Match: {n}% ({matched}/{total})

### 동적 검증 (코드 산출물)
- 빌드 테스트: [PASS / FAIL]
- 엔트리포인트 연결: [확인 / 미확인]
- 구동 테스트: [PASS / SKIP]

### 이슈
| 심각도 | 위치 | 설명 | 권장 조치 |
|--------|------|------|-----------|
| HIGH | ... | ... | ... |
```

---

## 관련 문서

| 문서 | 역할 |
|------|------|
| VALIDATION_GUIDE.md | 통합 검증 가이드 |
| imleader/SKILL.md | ImLeader 검증 Skill |
| reviewer/SKILL.md | Reviewer 검증 Skill (Orchestrator) |

---

**END OF QUALITY_RULES.md**

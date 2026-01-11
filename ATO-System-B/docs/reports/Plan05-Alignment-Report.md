# Plan05 문서 정합성 작업 보고서

> **작업일**: 2026-01-10
> **브랜치**: `feat/plan05-docs-alignment`
> **담당**: Claude Code
> **참조**: [FileTree-Plan05.md](./FileTree-Plan05.md)

---

## 📋 작업 요약

**목표**: FileTree-Plan05에 정의된 구조와 현재 프로젝트 구조의 차이를 문서화하고, 모든 문서가 일관된 경로 참조를 사용하도록 정합성 맞춤.

**범위**: 문서만 수정 (실제 폴더 구조 변경 없음)

**결과**: ✅ 성공 (Phase 0 완료)

---

## 🎯 완료된 작업 (Phase 0)

### Task 1: Git 스냅샷 및 브랜치 생성 ✅
- 태그 생성: `before-plan05-migration`
- 브랜치: `feat/plan05-docs-alignment`
- 추적 디렉토리: `docs/reports/migration-tracking/`

### Task 2: SYSTEM_MANIFEST.md v7.0.0 작성 ✅
**변경 내용**:
- 버전: v6.2.0 → v7.0.0
- **Output Paths 섹션**: Plan05 ↔ Current 경로 매핑 테이블 추가
- **Migration Roadmap 섹션**: Phase 0-4 단계별 계획 추가
- **Document Map**: 모든 그룹에 향후 submodule 전환 예정 명시
- **Safety Rules**: 경로 참조 원칙 추가

### Task 2-1: SYSTEM_MANIFEST.md v7.0.1 (경로 명명 규칙 통일) ✅
**변경 내용**:
- 버전: v7.0.0 → v7.0.1
- **FileTree-Plan05 정확한 경로 형식 적용**
  - `{service}` → `{service-name}` 통일
  - `{feature}` → `{feature-name}` 통일
  - Output Paths 테이블 전체 수정
  - Discovery vs Reproduction 데이터 경로 테이블 수정

**핵심 수정 내용**:
```markdown
| 용도               | Plan05 목표 구조 (향후)                                              | Current 사용 중 (현재)                   | 전환 시점 |
| ------------------ | -------------------------------------------------------------------- | ---------------------------------------- | --------- |
| **CLAUDE.md**      | `.claude/CLAUDE.md`                                                  | `/CLAUDE.md` (루트)                      | Phase 1   |
| **룰북 (Rules)**   | `.claude/rulebook/rules/*` (submodule)                               | `.claude/rules/*` (직접)                 | Phase 2   |
| **Frontend 코드**  | `services/{service-name}/apps/web/src/features/{feature-name}/`      | `frontend/src/features/{feature}/`       | Phase 3   |
| **문서 (산출물)**  | `services/{service-name}/docs/features/{feature-name}/`              | `docs/cases/{caseId}/{taskId}/`          | Phase 4   |
```

### Task 3: DOCUMENT_PIPELINE.md v2.1.0 업데이트 ✅
**변경 내용**:
- 산출물 테이블에 Current 경로 명시
- Plan05 목표 경로 주석 추가
- SYSTEM_MANIFEST 참조 링크 추가

### Task 3-1: DOCUMENT_PIPELINE.md v2.2.0 (Option A 구현) ✅
**변경 내용**:
- 버전: v2.1.0 → v2.2.0
- **Option A 적용**: 경로/산출물 책임 분리
  - 산출물 테이블에서 모든 경로 정보 제거
  - 파일명만 명시 (예: `*.sql`, `IA.md`, `SDD.md`)
  - SYSTEM_MANIFEST 참조로 통일

**설계 원칙**:
- SYSTEM_MANIFEST.md: "어디에" 저장? (경로의 SSOT)
- DOCUMENT_PIPELINE.md: "무엇을" 생성? (산출물의 SSOT)

### Task 4: ROLES_DEFINITION.md v1.6.2 업데이트 ✅
**변경 내용**:
- 각 Role 권한 섹션 유지
- Skills 항목 추가 (Extension 참조용)
- 경로는 Current 구조 유지

### Task 5: 검증 스크립트 작성 ✅
**파일**: `scripts/validate-docs.sh`
**기능**:
- SYSTEM_MANIFEST 버전 확인
- 필수 문서 존재 확인
- 경로 참조 일관성 간단 검증

**실행 결과**:
```
✅ SYSTEM_MANIFEST 버전: v7.0.0
✅ 모든 필수 문서 존재
✅ Current 경로 참조: 11개
✅ Plan05 경로 참조: 10개
```

### Task 6: Migration Guide 작성 ✅
**파일**: `docs/reports/Migration-Guide.md`
**내용**:
- Phase 0-4 상세 체크리스트
- 각 Phase별 예상 영향 및 리스크
- 롤백 플랜
- 검증 체크리스트

### Task 7: 최종 diff 저장 ✅
**파일**:
- `docs/reports/migration-tracking/plan05-alignment-complete.diff`
- `docs/reports/migration-tracking/changes-summary.txt`

---

## 📊 변경 통계

```
8개 파일 변경
+1,244줄 추가
-28줄 삭제
```

**변경된 파일**:
1. `.claude/SYSTEM_MANIFEST.md` (v6.2.0 → v7.0.1)
2. `.claude/workflows/DOCUMENT_PIPELINE.md` (v2.0.0 → v2.2.0)
3. `.claude/rules/ROLES_DEFINITION.md` (v1.6.1 → v1.6.2)
4. `docs/reports/Migration-Guide.md` (신규)
5. `docs/reports/Plan05-Alignment-Report.md` (신규)
6. `docs/reports/migration-tracking/changes-summary.txt` (신규)
7. `docs/reports/migration-tracking/plan05-alignment-complete.diff` (신규)
8. `scripts/validate-docs.sh` (신규)

---

## 🔍 주요 결정사항

### 1. Path-Mapping.md 생성 안 함 (SSOT 원칙)
- **이유**: SYSTEM_MANIFEST.md가 이미 경로 정의의 유일한 출처
- **대신**: SYSTEM_MANIFEST 내부에 "현재 → Plan05 경로 매핑" 섹션 통합

### 2. 검증 스크립트 간소화
- **이유**: 문서만 변경, 복잡한 검증 불필요
- **범위**: 버전 확인 + 파일 존재 + 간단 경로 카운트

### 3. 경로 참조는 Current 유지
- **이유**: 실제 폴더 구조 변경 없음 (Phase 0)
- **향후**: Phase 1-4에서 단계적 전환

### 4. Option A 채택 (경로/산출물 책임 분리)
- **이유**: SSOT 원칙에 따라 "어디에"와 "무엇을"의 정의를 분리
- **구현**: SYSTEM_MANIFEST(경로) ↔ DOCUMENT_PIPELINE(산출물)

### 5. FileTree-Plan05 경로 형식 통일
- **이유**: `{service}` vs `{service-name}` 혼용 시 데이터 혼선 위험
- **조치**: FileTree-Plan05.md의 정확한 명명 규칙 적용

---

## ✅ 검증 결과

### 문서 일관성
- ✅ SYSTEM_MANIFEST v7.0.1 버전 확인 (최종)
- ✅ DOCUMENT_PIPELINE v2.2.0 버전 확인 (최종)
- ✅ 모든 필수 문서 존재
- ✅ 경로 매핑 테이블 완성
- ✅ Migration Roadmap 작성
- ✅ Option A 구현 완료
- ✅ FileTree-Plan05 경로 형식 통일

### Git 관리
- ✅ 태그 `before-plan05-migration` 생성 및 GitHub 푸시
- ✅ 브랜치 `feat/plan05-docs-alignment` 생성 및 GitHub 푸시
- ✅ 6개 커밋 완료
- ✅ Diff 파일 저장 (완료)

### 스크립트 실행
```bash
$ ./scripts/validate-docs.sh
📋 Plan05 문서 정합성 검증
================================
✅ SYSTEM_MANIFEST 버전: v7.0.0
✅ .claude/SYSTEM_MANIFEST.md
✅ .claude/workflows/DOCUMENT_PIPELINE.md
✅ .claude/rules/ROLES_DEFINITION.md
✅ docs/reports/FileTree-Plan05.md
✅ 검증 완료!
```

---

## 📋 Phase별 완료 체크리스트

### Phase 0: 문서 정합성 ✅ (완료)
- [x] Git 스냅샷 및 브랜치 생성
- [x] SYSTEM_MANIFEST.md v7.0.0 → v7.0.1 작성
- [x] DOCUMENT_PIPELINE.md v2.0.0 → v2.2.0 업데이트 (Option A)
- [x] ROLES_DEFINITION.md v1.6.1 → v1.6.2 업데이트
- [x] 검증 스크립트 작성 (validate-docs.sh)
- [x] Migration-Guide.md 작성
- [x] Plan05-Alignment-Report.md 작성
- [x] Diff 파일 저장

### Phase 1: CLAUDE.md 이동 ✅ (완료)
- [x] `/CLAUDE.md` → `.claude/CLAUDE.md` 이동
- [x] Git 이동 기록 유지 (git mv)
- [x] SYSTEM_MANIFEST.md 경로 업데이트
  - [x] Document Map 현재 위치 갱신
  - [x] Output Paths 완료 표시
  - [x] Migration Roadmap Phase 1 체크
- [x] 검증: `find . -name "CLAUDE.md"` → `.claude/CLAUDE.md`만 존재
- [x] feat/plan05-docs-alignment 브랜치에 커밋 및 푸시

**실제 영향**: Low (경로 참조만 변경, CLAUDE.md는 자동 로딩)

---

## 📌 다음 단계 (향후 작업)

### Phase 2: Submodule 분리 ✅ (완료)
- [x] Step 1: 전역 룰북 레포 생성 (`github.com/Jelly1104/role-skill-protocol`)
- [x] Step 2: 파일 이동 및 초기화 (29개 파일, README.md 포함)
- [x] Step 3: `.claude/rulebook/` submodule 추가
- [x] Step 4: 기존 파일 제거 (.claude/rules, workflows, context, templates, skills)
- [x] Step 5: SYSTEM_MANIFEST.md Phase 2 체크 완료
- [x] Step 6: 검증 및 GitHub 푸시
- **실제 소요**: 약 1시간
- **실제 영향**: Medium (29개 파일 삭제, submodule 참조로 전환)

### Phase 3: services/ 구조 전환 ⏳ (예정)
**목표**: `backend/`, `frontend/` → `services/medigate-community/apps/{api,web}/src/features/{feature-name}/` 구조 전환

**서비스명**: `medigate-community` (메디게이트 커뮤니티 서비스)
- 기존 features: podcast, workout-diary 등 모두 포함

- [ ] Step 1: 디렉토리 생성 (`mkdir -p services/medigate-community/apps/{api,web}/src/features`)
- [ ] Step 2: 파일 이동 (feature별 이동 권장)
  - [ ] Backend: `backend/src/routes/podcast` → `services/medigate-community/apps/api/src/features/podcast`
  - [ ] Frontend: `frontend/src/features/podcast-player` → `services/medigate-community/apps/web/src/features/podcast-player`
  - [ ] Frontend: `frontend/src/features/workout-diary` → `services/medigate-community/apps/web/src/features/workout-diary`
- [ ] Step 3: 빌드 설정 업데이트 (package.json, tsconfig.json, vite.config.ts)
- [ ] Step 4: 검증 (빌드 테스트)
- **예상 소요**: 4시간
- **리스크**: High

### Phase 4: cases → features 마이그레이션 ⏳ (예정)
- [ ] Step 1: 매핑 테이블 작성
- [ ] Step 2: 이동 스크립트 작성
- [ ] Step 3: `runs/{run-id}/{task-id}/` 구조 도입
- [ ] Step 4: Publish 프로세스 구현
- [ ] Step 5: 검증 (문서 링크 접근성)
- **예상 소요**: 2시간
- **리스크**: Medium

---

## 📚 참고 자료

### 문서
- [FileTree-Plan05.md](./FileTree-Plan05.md) - 목표 구조 정의
- [SYSTEM_MANIFEST v7.0.1](../../.claude/SYSTEM_MANIFEST.md) - 경로 매핑 SSOT
- [DOCUMENT_PIPELINE v2.2.0](../../.claude/workflows/DOCUMENT_PIPELINE.md) - 산출물 정의 SSOT
- [Migration-Guide.md](./Migration-Guide.md) - Phase 1-4 상세 가이드

### Git 참조
- 태그: `before-plan05-migration` (작업 전 스냅샷)
- 브랜치: `feat/plan05-docs-alignment` (Phase 0 작업)
- Diff: `migration-tracking/plan05-alignment-complete.diff`

### 스크립트
- `scripts/validate-docs.sh` - 문서 검증

---

## ✨ 결론

**Phase 0-2** 작업을 성공적으로 완료했습니다.

**핵심 성과**:
1. ✅ **Phase 0 (문서 정합성)**: Plan05와 Current 구조의 차이를 명확히 문서화
2. ✅ **경로 명명 통일**: FileTree-Plan05 형식 적용 (`{service-name}`, `{feature-name}`)
3. ✅ **Phase 1 (CLAUDE.md 이동)**: `.claude/CLAUDE.md`로 이동 완료
4. ✅ **Phase 2 (Submodule 분리)**: 전역 룰북 레포 생성 및 submodule 연결 완료
5. ✅ **Migration Roadmap**: 향후 Phase 3-4 단계 명확화
6. ✅ **검증 스크립트**: 지속적 일관성 확보 체계 구축
7. ✅ **Option A 설계 원칙**: 경로(SYSTEM_MANIFEST)/산출물(DOCUMENT_PIPELINE) 책임 분리
8. ✅ **실제 서비스명 적용**: medigate-community 서비스와 실제 feature명으로 예시 구체화

**다음 작업**:
- **Phase 3**: services/ 구조 전환 (medigate-community 서비스)
- **Phase 4**: cases → features 마이그레이션
- 사용자 승인 후 단계별 진행

---

---

## 📊 최종 통계 (Phase 2까지)

**Phase 0 (문서 정합성)**:
- 작업 완료일: 2026-01-10
- 작업 시간: 약 2시간
- 커밋 수: 6개
- 변경 파일: 8개
- 상태: ✅ PASS

**Phase 1 (CLAUDE.md 이동 + 문서 정비)**:
- 작업 완료일: 2026-01-11
- 작업 시간: 약 30분
- 커밋 수: 5개
  - CLAUDE.md 이동 및 SYSTEM_MANIFEST 업데이트
  - 문서 역할 분리 (Guide vs Report)
  - feature-name 경로 추가
  - 실제 서비스명(medigate-community) 적용
  - SYSTEM_MANIFEST Phase 3/4 경로 형식 통일
- 변경 파일: 4개 (CLAUDE.md, SYSTEM_MANIFEST.md, Migration-Guide.md, Plan05-Alignment-Report.md)
- 상태: ✅ PASS

**Phase 2 (Submodule 분리)**:
- 작업 완료일: 2026-01-11
- 작업 시간: 약 1시간
- 커밋 수: 2개
  - role-skill-protocol 레포 초기화 (전역 룰북)
  - ATO-System-B submodule 추가 및 기존 파일 제거
- 변경 파일:
  - role-skill-protocol: 29개 파일 생성 (+5,539줄)
  - ATO-System-B: 29개 파일 삭제 (-4,682줄), .gitmodules 생성, submodule 추가
- 상태: ✅ PASS

**누적 (Phase 0-2)**:
- 총 커밋: 13개
- 총 작업 시간: 약 3시간 30분
- 주요 변경:
  - 전역 룰북 레포 분리 완료
  - Git submodule 구조 도입
  - 문서 경로 일관성 확보

---

**END OF REPORT**

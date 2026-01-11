# Migration Guide: Plan05 Structure

> **작성일**: 2026-01-10
> **대상**: ATO-System-B 프로젝트
> **참조**: [FileTree-Plan05.md](./FileTree-Plan05.md), [SYSTEM_MANIFEST v7.0.0](../../.claude/SYSTEM_MANIFEST.md)

---

## 개요

이 문서는 현재 프로젝트 구조를 **FileTree-Plan05**에 정의된 목표 구조로 전환하기 위한 단계별 가이드입니다.

### 현재 상태

- ✅ **Phase 0 완료**: 문서 정합성 맞춤 (2026-01-10)
  - SYSTEM_MANIFEST.md v7.0.0
  - 경로 매핑 테이블 작성
  - Plan05 참조 문서화

### 향후 계획

- ⏳ **Phase 1-4**: 실제 폴더 구조 전환 (미정)

---

## Phase 0: 문서 정합성 (✅ 완료)

### 목표
Plan05와 현재 구조의 차이를 문서화하고, 모든 문서가 일관된 경로 참조를 사용하도록 함.

### 작업 내용
1. ✅ SYSTEM_MANIFEST.md v7.0.0 작성
   - Plan05 ↔ Current 경로 매핑 테이블 추가
   - Migration Roadmap 섹션 추가
   - Document Map에 향후 submodule 전환 명시

2. ✅ DOCUMENT_PIPELINE.md v2.1.0 업데이트
   - 산출물 경로에 Current/Plan05 구분 추가

3. ✅ ROLES_DEFINITION.md v1.6.2 업데이트
   - 권한 섹션 경로 명시

4. ✅ 검증 스크립트 작성
   - `scripts/validate-docs.sh`

### 산출물
- 브랜치: `feat/plan05-docs-alignment`
- 태그: `before-plan05-migration`
- Diff: `docs/reports/migration-tracking/cumulative-changes.diff`

---

## Phase 1: CLAUDE.md 이동

### 목표
CLAUDE.md를 프로젝트 루트에서 `.claude/` 직하로 이동하여 Claude Code가 인식하도록 함.

### 작업 절차

1. **파일 이동 (git mv 사용)**
   ```bash
   git mv CLAUDE.md .claude/CLAUDE.md
   ```

2. **SYSTEM_MANIFEST.md 경로 업데이트**
   - Document Map: 현재 위치 갱신
   - Output Paths: 완료 표시 ✅
   - Migration Roadmap: Phase 1 체크

3. **검증**
   ```bash
   find . -name "CLAUDE.md"
   # 결과: .claude/CLAUDE.md만 존재해야 함
   ```

4. **커밋 및 푸시**
   ```bash
   git commit -m "feat: CLAUDE.md를 .claude/ 디렉토리로 이동"
   git push origin feat/plan05-docs-alignment
   ```

### 예상 영향
- **Low**: 경로 참조만 변경
- **참조 업데이트 불필요**: CLAUDE.md는 시스템 헌법으로 자동 로딩됨

### 롤백 플랜
```bash
git mv .claude/CLAUDE.md CLAUDE.md
git commit -m "revert: CLAUDE.md 위치 원복"
```

---

## Phase 2: Submodule 분리

### 목표
전역 룰북을 별도 레포(`role-skill-protocol`)로 분리하고 submodule로 참조.

### 작업 절차

#### Step 1: 전역 룰북 레포 생성
```bash
# GitHub에서 레포 생성
gh repo create strategy-ai-lab/role-skill-protocol --public

cd ~/repos
git clone https://github.com/strategy-ai-lab/role-skill-protocol
cd role-skill-protocol
```

#### Step 2: 파일 이동
```bash
# 현재 프로젝트에서 복사
cp -r /path/to/ATO-System-B/.claude/rules ./
cp -r /path/to/ATO-System-B/.claude/workflows ./
cp -r /path/to/ATO-System-B/.claude/context ./
cp -r /path/to/ATO-System-B/.claude/templates ./
cp -r /path/to/ATO-System-B/.claude/skills ./
cp /path/to/ATO-System-B/CLAUDE.md ./
cp /path/to/ATO-System-B/.claude/SYSTEM_MANIFEST.md ./

git add .
git commit -m "feat: 전역 룰북 초기 구조"
git push origin main
```

#### Step 3: Submodule 추가
```bash
cd /path/to/ATO-System-B
git submodule add https://github.com/strategy-ai-lab/role-skill-protocol .claude/rulebook
```

#### Step 4: 기존 파일 제거
```bash
git rm -r .claude/rules .claude/workflows .claude/context .claude/templates .claude/skills
```

#### Step 5: 문서 경로 업데이트
- `.claude/rules/*` → `.claude/rulebook/rules/*`
- `.claude/workflows/*` → `.claude/rulebook/workflows/*`
- 기타 경로 참조 수정

#### Step 6: 검증
```bash
git submodule status
git submodule update --init --recursive
```

### 예상 영향
- **Medium**: git 구조 변경, 다른 프로젝트에도 동기화 필요
- **Risk**: submodule 업데이트 누락
- **Test**: `git submodule update --init --recursive`

### 롤백 플랜
```bash
git submodule deinit .claude/rulebook
git rm .claude/rulebook
rm -rf .git/modules/.claude/rulebook
# 백업에서 원래 파일 복구
```

---

## Phase 3: services/ 구조 전환

### 목표
`backend/`, `frontend/` → `services/{service-name}/apps/{api,web}/src/features/{feature-name}/` 구조로 전환.

### 작업 절차

#### Step 1: 서비스 이름 결정
**현재 프로젝트**: `medigate-community` (메디게이트 커뮤니티 서비스)
- 모든 기존 features (podcast, workout-diary 등)는 이 서비스 하위에 속함

#### Step 2: 디렉토리 생성
```bash
mkdir -p services/medigate-community/apps/{api,web}/src/features
```

#### Step 3: 파일 이동
```bash
# 현재 구조에서 새 구조로 feature별 이동
# Backend features
git mv backend/src/routes/podcast services/medigate-community/apps/api/src/features/podcast

# Frontend features
git mv frontend/src/features/podcast-player services/medigate-community/apps/web/src/features/podcast-player
git mv frontend/src/features/workout-diary services/medigate-community/apps/web/src/features/workout-diary

# 또는 전체 이동 후 재구성
git mv backend/src services/medigate-community/apps/api/src
git mv frontend/src services/medigate-community/apps/web/src
# 이후 api/src/features/, web/src/features/ 구조로 정리
```

#### Step 4: 빌드 설정 업데이트
- `package.json` 경로 수정
- `tsconfig.json` paths 수정
- `vite.config.ts` root 수정

#### Step 5: 검증
```bash
cd services/medigate-community/apps/web
npm run build

cd ../api
npm run build
```

### 예상 영향
- **High**: 전체 경로 변경, 빌드 시스템 영향
- **Risk**: Import 경로 깨짐, 빌드 실패
- **Test**: 전체 빌드 + 테스트 실행

### 롤백 플랜
```bash
# medigate-community 서비스 구조에서 원래 구조로 복원
git mv services/medigate-community/apps/api/src/features/podcast backend/src/routes/podcast
git mv services/medigate-community/apps/web/src/features/podcast-player frontend/src/features/podcast-player
git mv services/medigate-community/apps/web/src/features/workout-diary frontend/src/features/workout-diary

# 또는 전체 복원
git mv services/medigate-community/apps/api/src backend/src
git mv services/medigate-community/apps/web/src frontend/src
# 설정 파일 원복
```

---

## Phase 4: cases → features 마이그레이션

### 목표
`docs/cases/{caseId}/{taskId}/` → `services/{service-name}/docs/features/{feature-name}/` 전환.

### 작업 절차

#### Step 1: 매핑 테이블 작성
```
# 현재 case/task 구조 → medigate-community 서비스의 feature로 매핑
docs/cases/case-001/task-001 → services/medigate-community/docs/features/podcast-player
docs/cases/case-002/task-001 → services/medigate-community/docs/features/workout-diary
...
```

#### Step 2: 이동 스크립트 작성
```bash
# scripts/migrate-cases-to-features.sh
```

#### Step 3: runs/ 구조 도입
`runs/{run-id}/{task-id}/` 구조 생성

#### Step 4: Publish 프로세스 구현
ImLeader 검증 PASS → output/ 발행

#### Step 5: 검증
기존 문서 링크 접근성 확인

### 예상 영향
- **Medium**: 문서 구조 변경, 스크립트 업데이트
- **Risk**: 기존 문서 링크 깨짐
- **Test**: 모든 PRD/SDD 문서 접근 테스트

### 롤백 플랜
```bash
# 이동 스크립트 역실행
```

---

## 최종 검증 (Phase 4 완료 후)

> **검증 체크리스트는 [Plan05-Alignment-Report.md](./Plan05-Alignment-Report.md)에서 관리**

### 빌드 검증
```bash
npm run build
npm test
```

### 문서 검증
```bash
./scripts/validate-docs.sh
```
- 모든 SYSTEM_MANIFEST 링크 클릭 테스트

### Git 검증
```bash
git diff before-plan05-migration HEAD > migration-final.diff
git submodule status
git submodule update --remote
```

---

## 리스크 관리

| Phase   | 주요 리스크                | 대응책                                   | 우선순위 |
| ------- | -------------------------- | ---------------------------------------- | -------- |
| Phase 1 | 경로 참조 누락             | 자동 검증 스크립트 실행                  | P2       |
| Phase 2 | Submodule 동기화 이슈      | 단계별 테스트, 롤백 플랜 준비            | P1       |
| Phase 3 | 빌드 실패, Import 깨짐     | Feature flag로 점진 전환, CI/CD 테스트   | P0       |
| Phase 4 | 기존 문서 링크 깨짐        | 리다이렉트 스크립트, 병행 운영 기간 설정 | P2       |

---

## 참고 자료

- [FileTree-Plan05.md](./FileTree-Plan05.md): 목표 구조 정의
- [SYSTEM_MANIFEST.md v7.0.0](../../.claude/SYSTEM_MANIFEST.md): 경로 매핑 테이블
- Git 태그: `before-plan05-migration` (작업 전 스냅샷)
- 브랜치: `feat/plan05-docs-alignment` (Phase 0 작업)

---

**END OF Migration-Guide.md**

# _archive/ Directory

> **작성일**: 2026-01-11
> **목적**: FileTree-Plan05 마이그레이션 시 이동된 기존 폴더 보관

---

## 📁 Archive 내용

이 디렉토리는 **FileTree-Plan05** 구조로 전환하면서 루트에서 이동된 기존 폴더들을 보관합니다.

```
_archive/
├── backend/           # 기존 Backend 코드 (예시: podcast-player는 services/로 이동됨)
├── frontend/          # 기존 Frontend 코드 (예시: podcast-player는 services/로 이동됨)
├── database/          # DB 마이그레이션 스크립트
├── mcp-server/        # MCP 서버
├── orchestrator/      # Orchestrator 도구 (JavaScript 기반)
├── public/            # Public 파일
├── src/               # 기존 소스 코드
├── workspace/         # 워크스페이스
└── legacy_agents/     # 레거시 에이전트 (기존 archive)
```

---

## 🔄 마이그레이션 상태

### 이동된 Feature (예시)

| Feature | 기존 위치 | 새 위치 | 상태 |
|---------|----------|---------|------|
| **podcast-player** | `backend/src/podcast`, `frontend/src/features/podcast-player` | `services/medigate-community/apps/{api,web}/src/features/podcast-player/` | ✅ 이동 완료 |

### 남은 Features (Archive 보관)

**Backend** (`_archive/backend/src/`):
- `board/` - 게시판 기능
- `dashboard/` - 대시보드 기능
- `routes/` - API 라우트 (boards.ts, dashboard.routes.ts, member.routes.ts)
- `services/` - 비즈니스 로직
- `repositories/` - DB 접근 계층

**Frontend** (`_archive/frontend/src/features/`):
- `Board/` - 게시판 UI
- `dashboard/` - 대시보드 UI
- `podcast/` - 팟캐스트 생성기
- `podcast-player-1turn/` - 팟캐스트 플레이어 (1턴 버전)
- `podcast-player-full/` - 팟캐스트 플레이어 (풀 버전)
- `podcast-script/` - 팟캐스트 스크립트
- `skills-dashboard/` - 스킬 대시보드
- `skills-dashboard-lite/` - 스킬 대시보드 라이트

---

## 🚀 새 Feature 개발 시

**Archive 참조 금지**: 새로운 feature는 반드시 Plan05 구조를 따라야 합니다.

```bash
# ❌ Bad: Archive에서 코드 복사
cp -r _archive/backend/src/board services/medigate-community/apps/api/src/features/

# ✅ Good: Plan05 구조로 새로 생성
mkdir -p services/medigate-community/apps/api/src/features/board
mkdir -p services/medigate-community/apps/web/src/features/board
mkdir -p services/medigate-community/docs/features/board
```

**참조 방법**:
1. **코드 재사용**: Archive 코드를 참조하되, Plan05 구조에 맞춰 재구성
2. **문서 작성**: PRD → HANDOFF → 분석/설계 → 구현 순서 준수
3. **예시 템플릿**: `services/medigate-community/docs/features/podcast-player/` 참조

---

## ⚠️ 주의사항

1. **읽기 전용**: Archive는 참조용으로만 사용, 직접 수정 금지
2. **빌드 불가**: Archive 코드는 루트 구조 변경으로 빌드 불가능
3. **Git 히스토리**: `git mv`로 이동했으므로 히스토리 보존됨
4. **향후 정리**: 필요 없는 코드는 주기적으로 완전 삭제 검토

---

## 📚 참고 문서

- [FileTree-Plan05.md](../docs/reports/FileTree-Plan05.md) - 목표 구조 정의
- [services/medigate-community/README.md](../services/medigate-community/README.md) - 서비스 구조 가이드
- [Migration-Guide.md](../docs/reports/Migration-Guide.md) - 마이그레이션 가이드

---

**END OF _archive/README.md**

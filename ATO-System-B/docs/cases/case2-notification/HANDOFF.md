# Handoff: 알림 발송 (케이스 #2)

> **From**: Leader Agent (Claude Code)
> **To**: Sub-agent (Cline)
> **Date**: 2025-12-16

---

## Mode

**Coding**

---

## Input 문서

모든 설계 문서는 **Leader Agent가 제공**했음을 명시합니다.

| 문서 | 경로 |
|------|------|
| IA.md | `docs/case2-notification/IA.md` |
| Wireframe.md | `docs/case2-notification/Wireframe.md` |
| SDD.md | `docs/case2-notification/SDD.md` |

---

## Output 기대

```
src/backend/
├── routes/notification.ts       # 알림 API 라우터
├── routes/admin/notification.ts # 관리자 알림 API
└── types/notification.ts        # 타입 정의

src/frontend/
├── components/NotificationList.tsx  # 알림 목록 컴포넌트
├── components/NotificationItem.tsx  # 알림 아이템 컴포넌트
└── types/notification.ts            # 프론트엔드 타입

tests/
└── notification.test.ts         # API 테스트 (선택)
```

---

## 제약사항

1. **DOMAIN_SCHEMA.md 준수**
   - 테이블/컬럼명 정확히 사용
   - `U_ID` VARCHAR(14), `READ_FLAG` CHAR(1) 등 타입 주의

2. **서버 데이터 보호**
   - ✅ SELECT만 허용
   - ❌ INSERT/UPDATE/DELETE 금지 (Mock 데이터 사용)

3. **PROJECT_STACK.md 기술 스택 준수**
   - Backend: Node.js + Express + TypeScript
   - Frontend: React + TypeScript + Tailwind CSS

4. **코드 품질**
   - TypeScript Strict Mode
   - 함수 길이 ≤ 30줄
   - 명확한 네이밍

---

## 참조해야 할 문서

- `CLAUDE.md` - 팀 헌법
- `.claude/global/DOMAIN_SCHEMA.md` - DB 스키마
- `.claude/global/CODE_STYLE.md` - 코딩 스타일
- `.claude/project/PROJECT_STACK.md` - 기술 스택

---

## 완료 후 보고 형식

작업 완료 시 아래 형식으로 Leader에게 보고:

```markdown
## Cline 작업 완료 보고

### 생성된 파일
- [파일 목록]

### 실행 결과
- 테스트: PASS/FAIL (X개 중 X개)
- 린트: X errors
- 타입체크: PASS/FAIL

### 이슈/질문
- [있으면 기재, 없으면 "없음"]

### 정책 준수 여부
- .clinerules 위반: 없음 / 있음
```

---

**END OF HANDOFF**

*이 문서를 읽은 후 구현을 시작하세요.*

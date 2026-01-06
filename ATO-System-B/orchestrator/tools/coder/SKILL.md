---
name: coder
description: SDD 기반 코드 구현. HANDOFF/SDD를 기반으로 Backend API와 Frontend 컴포넌트를 구현한다. v1.5.0에서 엔트리포인트 연결 및 구동 테스트 필수화.
version: 1.5.0
status: active
updated: 2026-01-06
implementation: orchestrator/skills/coder/index.js
---

# Coder Skill (Orchestrator용)

설계 문서 기반 코드 구현 전문가.

## 핵심 역할

| 영역 | 산출물 |
|------|--------|
| **Backend** | Express API, Controller, Service, Repository |
| **Frontend** | React 컴포넌트, Hooks, 타입 정의 |
| **Test** | Jest 단위/통합 테스트 |

## 기술 스택

| 영역 | 스택 |
|------|------|
| Frontend | React 18+, TypeScript, TailwindCSS |
| Backend | Node.js, Express, TypeScript |
| Database | MySQL (레거시 DB 연동) |
| Testing | Jest, React Testing Library |

## 제약사항

| 제약 | 설명 |
|------|------|
| 설계 준수 | SDD 명세 정확히 따름, 임의 변경 금지 |
| 기존 패턴 | 코드베이스의 기존 패턴 유지 |
| 보안 | SQL Injection, XSS 방지 필수 |
| 테스트 | 주요 함수/컴포넌트 테스트 코드 포함 |

> **PRD 직접 참조 금지** - SDD를 통해서만 요구사항 확인

## Input Format

```json
{
  "handoff": {
    "mode": "Code",
    "requiredOutputs": ["API 엔드포인트", "React 컴포넌트"],
    "inputDocuments": {
      "sdd": "SDD.md 내용",
      "wireframe": "Wireframe.md 내용",
      "ia": "IA.md 내용"
    }
  },
  "taskContext": {
    "featureName": "기능명",
    "targetPath": "src/features/{feature}",
    "existingCode": {}  // 관련 기존 코드 (선택)
  }
}
```

---

## Output Format

```json
{
  "files": {
    "src/features/{feature}/api/routes.ts": "// 코드 내용",
    "src/features/{feature}/api/controller.ts": "// 코드 내용",
    "src/features/{feature}/components/FeatureView.tsx": "// 코드 내용",
    "src/features/{feature}/__tests__/routes.test.ts": "// 테스트 코드",
    "src/shared/types/{feature}.dto.ts": "// 공통 타입 정의"
  },
  "database": {
    "migration": "src/migrations/YYYYMMDD_add_{feature}.sql",
    "content": "CREATE TABLE IF NOT EXISTS ..."
  },
  "integration": {
    "instructions": [
      "src/app.ts 파일에 `app.use('/api/v1/{feature}', featureRouter)` 추가 필요",
      "src/routes/index.ts에 라우터 import 추가"
    ]
  },
  "summary": {
    "filesCreated": 5,
    "linesOfCode": 450,
    "testCoverage": ["routes.ts", "controller.ts"]
  },
  "dependencies": {
    "new": ["axios", "react-query"],
    "existing": ["express", "mysql2"],
    "devDependencies": ["@types/express"]
  },
  "mockData": {
    "testFixtures": "src/features/{feature}/__tests__/fixtures.ts"
  },
  "notes": [
    "구현 시 고려한 사항",
    "추가 검토 필요 사항"
  ]
}
```

### 공통 타입 관리 (DTO/Interface)

Frontend와 Backend 타입 일치를 위해 공통 타입을 `shared/types/`에 정의:

```typescript
// src/shared/types/{feature}.dto.ts
export interface FeatureCreateRequest {
  name: string;
  description?: string;
}

export interface FeatureResponse {
  id: string;
  name: string;
  createdAt: Date;
}
```

### DB Migration 처리

새 테이블/컬럼이 필요한 경우 마이그레이션 SQL 포함:

```sql
-- src/migrations/20251219_create_feature_table.sql
CREATE TABLE IF NOT EXISTS feature (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Workflow

1. **설계 문서 분석**: SDD.md에서 API 명세, 데이터 모델 추출
2. **구조 설계**: 파일/폴더 구조 결정
3. **Backend 구현**: API 라우트 → 컨트롤러 → 서비스 → 리포지토리
4. **Frontend 구현**: 컴포넌트 → 훅 → API 클라이언트
5. **테스트 작성**: 단위 테스트 및 통합 테스트
6. **의존성 정리**: 필요한 패키지 목록 작성

---

## Code Templates

### API Route Template
```typescript
// src/features/{feature}/api/routes.ts
import { Router } from 'express';
import { FeatureController } from './controller';
import { validateRequest } from '@/middleware/validation';
import { FeatureCreateRequest } from '@/shared/types/{feature}.dto';

const router = Router();
const controller = new FeatureController();

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validateRequest(FeatureCreateRequest), controller.create);

export default router;
```

### Controller Template (with Error Handling)
```typescript
// src/features/{feature}/api/controller.ts
import { Request, Response, NextFunction } from 'express';
import { FeatureService } from './service';

export class FeatureController {
  private service = new FeatureService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.findAll(req.query);
      res.json(result);
    } catch (error) {
      next(error); // 전역 에러 핸들러로 위임
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.create(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };
}
```

### React Component Template
```tsx
// src/features/{feature}/components/FeatureView.tsx
import React from 'react';
import { useFeatureData } from '../hooks/useFeatureData';

interface FeatureViewProps {
  id: string;
}

export const FeatureView: React.FC<FeatureViewProps> = ({ id }) => {
  const { data, isLoading, error } = useFeatureData(id);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러 발생: {error.message}</div>;

  return (
    <div className="feature-container">
      {/* UI 구현 */}
    </div>
  );
};
```

### Repository Template
```typescript
// src/features/{feature}/repository.ts
import { db } from '@/lib/database';

export class FeatureRepository {
  async findAll(options: QueryOptions) {
    const query = `SELECT * FROM table WHERE condition = ?`;
    return db.query(query, [options.param]);
  }

  async findById(id: string) {
    const query = `SELECT * FROM table WHERE id = ?`;
    const [rows] = await db.query(query, [id]);
    return rows[0];
  }
}
```

---

## Error Handling

| 에러 유형 | 대응 방안 |
|----------|----------|
| 설계 문서 불완전 | Leader Agent에 보완 요청 |
| 기존 코드 충돌 | 기존 패턴 우선, 변경 사항 노트에 기록 |
| 의존성 문제 | package.json 업데이트 제안 |
| 타입 에러 | TypeScript strict 모드 준수 |

---

## Quality Checklist

- [ ] SDD.md의 모든 API 엔드포인트 구현
- [ ] Wireframe.md의 모든 화면 컴포넌트 구현
- [ ] 에러 핸들링 포함 (try-catch + next(error))
- [ ] 입력 값 검증 (validation middleware)
- [ ] SQL Injection 방지 (parameterized query)
- [ ] XSS 방지 (출력 이스케이프)
- [ ] 테스트 코드 작성 (커버리지 80% 이상 목표)
- [ ] Mock 데이터/Fixture 포함
- [ ] 코드 주석 포함
- [ ] 공통 타입(DTO) 정의
- [ ] DB 마이그레이션 SQL 포함 (필요 시)
- [ ] Integration Instructions 포함

---

## 완료 조건 (v1.5.0 추가) ⚠️ 필수

> 코드 작성만으로는 완료가 아닙니다. **실제 구동 가능한 상태**까지 확인해야 합니다.

### 필수 체크리스트

- [ ] 컴포넌트/모듈 코드 작성 완료
- [ ] 타입 정의 파일 작성 완료
- [ ] **엔트리포인트 연결** (main.tsx에서 import/렌더링)
- [ ] **빌드 테스트 통과** (`npm run build` 또는 `tsc --noEmit`)
- [ ] **구동 테스트** (`npm run dev` 실행 후 렌더링 확인)

### 엔트리포인트 연결 가이드

```typescript
// frontend/src/main.tsx 예시
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SkillsDashboard } from './features/skills-dashboard'  // ← 새 컴포넌트 import

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SkillsDashboard />  {/* ← 렌더링 */}
  </React.StrictMode>,
)
```

### 구동 테스트 절차

1. `cd frontend && npm install` (의존성 설치)
2. `npm run build` 또는 `tsc --noEmit` (빌드/타입 체크)
3. `npm run dev` (개발 서버 실행)
4. 브라우저에서 렌더링 확인

### 미완료 시 조치

| 상황 | 조치 |
|------|------|
| 엔트리포인트 미연결 | main.tsx 수정하여 import 추가 |
| 빌드 실패 | 에러 메시지 기반 타입/문법 오류 수정 |
| 런타임 에러 | 콘솔 에러 확인 후 수정 |

> **주의**: 위 체크리스트를 모두 통과해야 Coder Skill 작업이 완료된 것으로 간주합니다.

---

## Context Limit 대응

파일이 많거나 길어서 토큰 한계에 도달할 경우:

1. **핵심 로직 우선**: API 라우트와 핵심 서비스 먼저 생성
2. **UI 분리**: Frontend 컴포넌트는 별도 단계로 요청
3. **테스트 후속**: 테스트 코드는 구현 완료 후 별도 요청

```
Coder Skill 1차: Backend (routes, controller, service, repository)
Coder Skill 2차: Frontend (components, hooks)
Coder Skill 3차: Tests (unit tests, fixtures)
```

---

## Designer Skill과의 관계

> ⚠️ **중요**: Coder Skill은 Designer Skill의 HTML 산출물을 참조하지 않습니다.

| Skill | 참조 | 산출물 |
|----------|------|--------|
| Coder Skill | `Wireframe.md` (원본) | React 컴포넌트 |
| Designer Skill | `Wireframe.md` (원본) | HTML 프리뷰 |

- 두 Skill 모두 **Markdown 원본**을 기준으로 작업
- Designer Skill 산출물은 이해관계자 검증용
- Coder Skill 산출물은 실제 프로덕션 코드

---

**END OF SKILL**

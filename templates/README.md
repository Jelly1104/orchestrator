# requirement/ 폴더 가이드

이 폴더는 기획서와 스펙 문서를 관리한다.
코드 변경 시 관련 문서도 반드시 함께 수정한다.

---

## 1. 폴더 구조

```
requirement/
├── README.md              # 이 문서
├── specs/                 # 기능 스펙 문서
│   ├── TEMPLATE.md        # 스펙 문서 템플릿
│   └── {기능명}.md        # 개별 기능 스펙
├── api/                   # API 명세
│   └── {서비스명}.md
└── archive/               # 폐기된 문서 (삭제 대신 이동)
```

---

## 2. 문서 생성 규칙

* 파일명은 `{기능명}.md` 형식을 따른다.
* 띄어쓰기는 하이픈으로 대체한다.
* 새 기능 개발 시 `specs/TEMPLATE.md`를 복사하여 시작한다.

**파일명 예시:**
* `profile-auto-generation.md`
* `search-improvement.md`
* `comment-sentiment-analysis.md`

---

## 3. 문서 상태

각 문서 상단 메타데이터에 상태를 명시한다.

* **draft:** 작성 중, 구현 시작 전
* **active:** 구현 중 또는 운영 중
* **deprecated:** 폐기 예정, archive/로 이동 대기
* **archived:** archive/ 폴더로 이동 완료

---

## 4. 문서-코드 매핑

### 문서 내 코드 경로 명시

문서 하단 "관련 코드" 섹션에 해당 기능의 코드 경로를 기록한다.

```markdown
## 관련 코드

* `src/backend/profile/generator.py`
* `src/web/components/ProfileForm.tsx`
* `tests/backend/profile/test_generator.py`
```

### 코드 내 문서 경로 명시

주요 모듈이나 함수 상단 주석에 스펙 문서 경로를 기록한다.

```python
# 스펙: requirement/specs/profile-auto-generation.md
def generate_profile():
    ...
```

```typescript
// 스펙: requirement/specs/profile-auto-generation.md
export const ProfileForm: React.FC = () => {
    ...
}
```

---

## 5. 문서 폐기 절차

* 문서를 바로 삭제하지 않는다.
* 먼저 상태를 `deprecated`로 변경하고 폐기 사유를 기록한다.
* 이후 `archive/` 폴더로 이동하고 상태를 `archived`로 변경한다.
* archive 폴더 내 문서는 6개월 후 삭제를 검토한다.

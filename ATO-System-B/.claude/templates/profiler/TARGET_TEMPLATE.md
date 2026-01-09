# SEGMENT_RULES_TEMPLATE.md

> **버전**: 2.1.0 | **수정일**: 2026-01-09
> **정의**: 세그먼트 정의 규칙 (공통 템플릿)
> **대상**: Profiler | **로딩**: 작업 시

---

## 1. 활동 기반 세그먼트

### 활성도 세그먼트 (Activity Level)

| 세그먼트 | 정의 | 조건 |
|----------|------|------|
| **HEAVY** | 고활동 사용자 | {{HEAVY_CONDITION}} |
| **MEDIUM** | 중활동 사용자 | {{MEDIUM_CONDITION}} |
| **LIGHT** | 저활동 사용자 | {{LIGHT_CONDITION}} |
| **DORMANT** | 휴면 사용자 | {{DORMANT_CONDITION}} |
| **CHURNED** | 이탈 사용자 | {{CHURNED_CONDITION}} |

### SQL 조건 예시
```sql
{{ACTIVITY_SQL_EXAMPLE}}
```

---

## 2. 라이프사이클 세그먼트

### 회원 생애주기 (Lifecycle Stage)

| 세그먼트 | 정의 | 조건 |
|----------|------|------|
| **NEW** | 신규 회원 | {{NEW_CONDITION}} |
| **GROWING** | 성장 회원 | {{GROWING_CONDITION}} |
| **MATURE** | 성숙 회원 | {{MATURE_CONDITION}} |
| **AT_RISK** | 이탈 위험 | {{AT_RISK_CONDITION}} |
| **REACTIVATED** | 재활성화 | {{REACTIVATED_CONDITION}} |

---

## 3. 속성 기반 세그먼트

> **참조**: {{CODE_TABLE_REFERENCE}}

### 속성 A - {{ATTRIBUTE_A_NAME}}

| 코드 | 세그먼트명 | 비고 |
|------|----------|------|
| {{CODE_A1}} | {{NAME_A1}} | {{NOTE_A1}} |
| {{CODE_A2}} | {{NAME_A2}} | {{NOTE_A2}} |
| ... | ... | ... |

### 속성 B - {{ATTRIBUTE_B_NAME}}

| 코드 | 세그먼트명 | 비고 |
|------|----------|------|
| {{CODE_B1}} | {{NAME_B1}} | {{NOTE_B1}} |
| {{CODE_B2}} | {{NAME_B2}} | {{NOTE_B2}} |
| ... | ... | ... |

---

## 4. 행동 기반 세그먼트

### 서비스 이용 패턴

| 세그먼트 | 정의 | 주요 행동 |
|----------|------|----------|
| {{BEHAVIOR_SEG_1}} | {{BEHAVIOR_DEF_1}} | {{BEHAVIOR_ACTION_1}} |
| {{BEHAVIOR_SEG_2}} | {{BEHAVIOR_DEF_2}} | {{BEHAVIOR_ACTION_2}} |
| {{BEHAVIOR_SEG_3}} | {{BEHAVIOR_DEF_3}} | {{BEHAVIOR_ACTION_3}} |
| {{BEHAVIOR_SEG_4}} | {{BEHAVIOR_DEF_4}} | {{BEHAVIOR_ACTION_4}} |

---

## 5. 가치 기반 세그먼트

### 회원 가치 (Value Tier)

| 세그먼트 | 정의 | 기준 |
|----------|------|------|
| **VIP** | 최고가치 | {{VIP_CRITERIA}} |
| **HIGH_VALUE** | 고가치 | {{HIGH_VALUE_CRITERIA}} |
| **STANDARD** | 일반 | {{STANDARD_CRITERIA}} |
| **LOW_VALUE** | 저가치 | {{LOW_VALUE_CRITERIA}} |

---

## 6. 세그먼트 조합 규칙

### 복합 세그먼트 생성
여러 기준을 조합하여 세그먼트 생성 가능:

```
[활동] + [속성] + [행동]
예: {{COMPOSITE_SEGMENT_EXAMPLE}}
```

### 우선순위
1. 활동 기반 (가장 최신 상태 반영)
2. 라이프사이클 (장기 추세 반영)
3. 속성 기반 (고정 속성)
4. 행동 기반 (특정 패턴 식별)

---

## 7. 세그먼트 분석 시 주의사항

### 최소 표본 크기
- 통계적 유의성을 위해 세그먼트당 최소 {{MIN_SAMPLE_SIZE}}명 이상
- {{MIN_SAMPLE_SIZE}}명 미만 시 상위 세그먼트와 병합 또는 제외

### 중복 처리
- 한 회원이 여러 세그먼트에 속할 수 있음
- 분석 목적에 따라 primary segment 지정

### 시간 기준
- 활동 세그먼트: {{ACTIVITY_TIME_WINDOW}} 기준
- 라이프사이클: 전체 기간 고려
- 정기적 재분류 ({{RECLASSIFICATION_CYCLE}})

### 스키마 준수 필수
- {{SCHEMA_CONSTRAINT_1}}
- {{SCHEMA_CONSTRAINT_2}}
- {{SCHEMA_CONSTRAINT_3}}

---

**END OF SEGMENT_RULES_TEMPLATE.md**

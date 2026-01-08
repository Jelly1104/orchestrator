# DOMAIN_SCHEMA.md

> **버전**: 1.2.0 | **수정일**: 2026-01-08
> **정의**: DB 테이블/컬럼, 레거시 매핑
> **대상**: All | **로딩**: 전체

---

## 이 문서의 목적

메디게이트의 **비즈니스 가치**와 **실제 레거시 DB 구조(Physical Schema)**를 정의합니다.
AI는 이 문서를 참조하여 **Hallucination(없는 컬럼 참조) 없는 유효한 SQL**을 작성해야 합니다.

---

## 비즈니스 구조

### 수익 모델

```
[B2C - 의료인 대상]
├── 채용공고 (유료) Critical (User Payment)
├── 임대/양도 (유료) Critical
└── 입지분석 (유료) Critical

[B2B - 제약사 대상]
├── 타겟 광고 (유료) High Revenue (Pharma Marketing)
└── 마케팅 솔루션 (유료) High Revenue

[트래픽 생성]
└── 의료인 커뮤니티 (무료) → 트래픽 확보 → 유료 전환
```

---

### 플랫폼 서비스 구조

| Group | 서비스명   | 주요 테이블              | 비즈니스 중요도                    |
| ----- | ---------- | ------------------------ | ---------------------------------- |
| 1     | 커뮤니티   | `BOARD_*` (29개)         | 트래픽/체류시간 핵심               |
| 2     | 채용/구인  | `CBIZ_REC*` (19개)       | B2C 핵심 수익원                    |
| 3     | 임대/양도  | `CBIZ_LEASE*` (17개)     | 부동산/개원 연계                   |
| 4     | 제약마케팅 | `EMT_*`, `OP_*` (60개)   | B2B 핵심 수익원 (절대 안정성 요구) |
| 5     | 광고/배너  | `AD_*`                   | 매출 연동                          |
| 6     | 의학교육   | `CME_*`, `VIDEO_*`(34개) | Engagement                         |
| 7     | 입지분석   | `LOCATION_*` (23개)      | 데이터 상품                        |

---

## 데이터 규모 및 성능 제약

⚠️ 다음 테이블 접근 시 인덱스/페이징 필수 (Full Scan 절대 금지)

| 순위 | 테이블          | 행 수(Row) | 용량   | 위험도     | 설명                                  |
| ---- | --------------- | ---------- | ------ | ---------- | ------------------------------------- |
| 1    | `USER_LOGIN`    | 2,267만    | 2.55GB | 🚨 Extreme | 로그인 이력 (최근 3개월만 조회 권장)  |
| 2    | `COMMENT`       | 1,826만    | 5.56GB | 🚨 Extreme | 게시글 반응 (반드시 BOARD_IDX로 조회) |
| 3    | `BOARD_MUZZIMA` | 337만      | 1.7GB  | 🔴 High    | 메인 게시판 본문 (TEXT 타입 주의)     |
| 4    | `POINT_GRANT`   | 64만       | 94MB   | 🟡 Medium  | 포인트 적립 내역                      |
| 5    | `USERS`         | 20만       | 92MB   | 🟢 Low     | 회원 마스터                           |

### 대용량 테이블 인덱스 현황

| 테이블          | 인덱스 컬럼           | 용도                 |
| --------------- | --------------------- | -------------------- |
| `USER_LOGIN`    | (U_ID, LOGIN_DATE)    | 사용자별 로그인 조회 |
| `COMMENT`       | (BOARD_IDX, SVC_CODE) | 게시글별 댓글 조회   |
| `BOARD_MUZZIMA` | (CTG_CODE, REG_DATE)  | 카테고리별 최신순    |

---

## 개념-물리 매핑 (Legacy Mapping)

레거시 테이블 분산 구조를 논리적 엔티티로 해석하는 규칙입니다.

| 개념 엔티티(Concept) | 물리 테이블(Physical)                | 관계     | 설명                                                             |
| -------------------- | ------------------------------------ | -------- | ---------------------------------------------------------------- |
| 회원(Member)         | `USERS` + `USER_DETAIL` + `USER_CI`  | 1:1:1    | 회원 기본정보 + 상세정보 + 본인인증                              |
| 게시글(Article)      | `BOARD_*` (Sharding)                 | Sharding | 게시판 성격별로 물리적 분리됨 (예: `BOARD_MUZZIMA`, `BOARD_ASK`) |
| 댓글(Comment)        | `COMMENT` (통합) + `BOARD_*_COMMENT` | Mixed    | 과거 댓글은 개별 테이블, 최신 댓글은 통합 테이블                 |
| 채용공고(Job)        | `CBIZ_RECJOB` + `CBIZ_RECJOB_MAP`    | 1:N      | 공고 기본 정보 + 직무/지역 매핑 정보                             |
| 임대매물(Lease)      | `CBIZ_LEASE` + `CBIZ_LEASE_PARTNER`  | N:1      | 매물 정보 + 중개 파트너사 정보                                   |

---

## 핵심 레거시 스키마 (Physical Legacy Schema)

⚠️ 주의: AI는 반드시 아래의 실제 컬럼명을 사용해야 합니다. (추측 금지)

### Users (회원 기본)

```sql
CREATE TABLE USERS (
  U_ID            VARCHAR(14) PRIMARY KEY,
  U_EMAIL         VARCHAR(120) UNIQUE,
  U_NAME          VARCHAR(256),         -- (Length 256)
  U_KIND          CHAR(6),              -- 'DOC001' 등 6자리 코드 (NOT VARCHAR)
  U_ALIVE         CHAR(6) DEFAULT 'Y',  -- 'Y'/'N' 등 상태값 (Length 6 주의)
  U_REG_DATE      DATETIME              -- (NOT REG_DATE)
  -- 면허정보는 USER_DOCTOR_LICENSE 별도 테이블 참조 (U_ID FK)
);
```

### User_Detail (회원 상세)

```sql
CREATE TABLE USER_DETAIL (
  U_ID            VARCHAR(14) PRIMARY KEY,  -- USERS.U_ID FK
  U_MAJOR_CODE_1  CHAR(6),                  -- 전문과목 1 (CODE_MASTER 참조)
  U_MAJOR_CODE_2  CHAR(6),                  -- 전문과목 2 (복수 전공)
  U_WORK_TYPE_1   CHAR(6),                  -- 근무형태 (개원/봉직/전공의 등)
  U_OFFICE_ZIP    VARCHAR(10),              -- 근무지 우편번호 (CODE_LOC 참조)
  U_OFFICE_ADDR   VARCHAR(200),             -- 근무지 주소
  U_HOSPITAL_NAME VARCHAR(100),             -- 병원/의원명
  U_CAREER_YEAR   INT,                      -- 경력 연수
  CONSTRAINT FK_USER_DETAIL_USER FOREIGN KEY (U_ID) REFERENCES USERS(U_ID)
);
```

**⚠️ 주의**:

- 전문과목 분석 시 `U_MAJOR_CODE_1` 사용 (NOT `MAJOR_CODE`)
- 근무형태 분석 시 `U_WORK_TYPE_1` 사용 (NOT `WORK_TYPE_CODE`)

### Code_Master (코드 마스터)

```sql
CREATE TABLE CODE_MASTER (
  CODE_TYPE       VARCHAR(20),              -- 코드 유형 (MAJOR, WORK_TYPE 등)
  CODE_VALUE      CHAR(6),                  -- 코드값 (DOC001, IM, GS 등)
  CODE_NAME       VARCHAR(100),             -- 코드명 (의사, 내과, 외과 등)
  CODE_ORDER      INT,                      -- 정렬 순서
  USE_FLAG        CHAR(1) DEFAULT 'Y',      -- 사용 여부
  PRIMARY KEY (CODE_TYPE, CODE_VALUE)
);
```

**주요 코드 유형**:
| CODE_TYPE | 설명 | 예시 |
|-----------|------|------|
| `U_KIND` | 회원유형 | DOC001(의사), PHA001(약사) |
| `MAJOR` | 전문과목 | IM(내과), GS(외과), PSY(정신건강의학과) |
| `WORK_TYPE` | 근무형태 | OWN(개원), EMP(봉직), RES(전공의) |

### Code_Loc (지역 코드)

```sql
CREATE TABLE CODE_LOC (
  ZIP_CODE        VARCHAR(10) PRIMARY KEY,  -- 우편번호
  SIDO            VARCHAR(20),              -- 시/도
  SIGUNGU         VARCHAR(30),              -- 시/군/구
  DONG            VARCHAR(30),              -- 읍/면/동
  FULL_ADDR       VARCHAR(200)              -- 전체 주소
);
```

### Posts (게시글 - 대표 구조: BOARD_MUZZIMA)

```sql
CREATE TABLE BOARD_MUZZIMA (
  BOARD_IDX       INT PRIMARY KEY,      -- (MySQL AUTO_INCREMENT)
  CTG_CODE        CHAR(6),              -- (NOT SVC_CODE) 카테고리 코드
  U_ID            VARCHAR(20),
  TITLE           VARCHAR(200),
  CONTENT         MEDIUMTEXT,
  READ_CNT        INT DEFAULT 0,
  AGREE_CNT       INT DEFAULT 0,
  REG_DATE        DATETIME
);
```

### Comments (댓글 - COMMENT)

```sql
CREATE TABLE COMMENT (
  COMMENT_IDX     INT UNSIGNED PRIMARY KEY,  -- (NOT CMT_IDX)
  BOARD_IDX       INT UNSIGNED,              -- (Unsigned 주의)
  SVC_CODE        VARCHAR(10),               -- 게시판 구분 필수
  U_ID            VARCHAR(16),               -- (Length 16)
  CONTENT         MEDIUMTEXT,                -- (NOT TEXT)
  PARENT_IDX      INT UNSIGNED,              -- (NOT P_CMT_IDX) 대댓글 부모 ID
  REG_DATE        DATETIME
);
```

---

## 자주 사용하는 쿼리 패턴 (Legacy Pattern)

### 유효한 채용공고 조회

```sql
WHERE APPROVAL_FLAG='Y'
  AND START_DATE <= NOW()
  AND END_DATE >= NOW()
  AND DISPLAY_FLAG='Y'
  AND DEL_FLAG='N'
```

### 카테고리별 게시글 페이징

```sql
WHERE CTG_CODE=?
ORDER BY GRP_IDX DESC, GRP_SEQ ASC -- 레거시 정렬 방식
```

### 활성 의사 회원만 조회 (Corrected)

```sql
WHERE U_KIND = 'DOC001'
  AND U_ALIVE = 'Y' -- (Legacy: CHAR(6))
```

---

## 보안 및 접근 제어

> **역할 분리**: 이 섹션은 민감 데이터의 **정의(What)**를 다룹니다.
>
> - 접근 권한, 실행 제한, 감사 로깅 → `DB_ACCESS_POLICY.md` 참조
> - 쿼리 실행 전 검증 규칙 → `VALIDATION_GUIDE.md` 참조

### 민감 데이터 분류

```yaml
최고 민감:
  - 면허번호 (license_number)
  - 주민등록번호 (저장 금지)

고민감:
  - 이메일
  - 연락처
  - 근무지 정보

주의:
  - 환자 정보는 일체 저장 금지
  - 진료 내역 저장 금지
```

### 복합 쿼리 제한 (Composite Query Whitelist)

**PII(개인식별정보) 추론 방지를 위해 허용된 JOIN 패턴만 사용합니다.**

#### ✅ 허용된 복합 쿼리 패턴

| 패턴                | 용도                 | 예시                        |
| ------------------- | -------------------- | --------------------------- |
| `BOARD_* + USERS`   | 게시글 작성자 표시   | 게시글 목록에 작성자명 표시 |
| `COMMENT + USERS`   | 댓글 작성자 표시     | 댓글에 작성자명 표시        |
| `CBIZ_REC* + USERS` | 채용공고 담당자 표시 | 공고에 담당자 정보 표시     |

#### ❌ 금지된 복합 쿼리 패턴

| 패턴                            | 위험       | 이유                                         |
| ------------------------------- | ---------- | -------------------------------------------- |
| `USERS + USER_LOGIN + COMMENT`  | 🚨 High    | 행태 추적 (누가 언제 어디서 활동했는지 추론) |
| `USERS + USER_DETAIL + USER_CI` | 🚨 Extreme | 완전한 개인정보 조합                         |
| `USERS + POINT_GRANT + CBIZ_*`  | 🔴 High    | 거래/수익 패턴 추론                          |

#### 복합 쿼리 요청 시 절차

```yaml
1. 위 허용 패턴에 해당하는가?
- YES → 진행
- NO → 2번으로

2. Leader Agent에게 승인 요청
- 사유 명시 필수
- 최소 필요 컬럼만 SELECT

3. 승인 없이 3개 이상 테이블 JOIN 금지
```

> **역할 분리**: 접근 권한/실행 제한/감사 로깅은 `DB_ACCESS_POLICY.md`를 참조하세요.

---

**END OF DOMAIN_SCHEMA.MD**

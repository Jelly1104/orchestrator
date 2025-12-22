# OpenSearch Schema Validator

OpenSearch에 인덱싱된 JSON 데이터와 MySQL DB 원본 데이터를 비교 검증하는 도구

## 지원 콘텐츠 타입

| URL 패턴 | 타입 | DB 테이블 |
|----------|------|-----------|
| `/recruit/{id}` | 봉직의 | CBIZ_RECJOB + CBIZ_RECJOB_MAP |
| `/lease/{id}` | 임대 | CBIZ_LEASE + CBIZ_LEASE_PARTNER |

## 설치

```bash
cd opensearch-schema-validator
pip install -r requirements.txt

# UI 스크래핑 사용 시
pip install playwright
python -m playwright install chromium
```

## 사용법

### 기본 실행 (DB vs JSON)
```bash
python validator.py samples/sample.csv
```

### UI 포함 3-way 비교 (DB vs JSON vs UI)
```bash
python validator.py samples/sample.csv --with-ui --user USERNAME --pass PASSWORD
```

### 옵션
```
--output FILE    출력 파일명 지정
--with-ui        UI 스크래핑 활성화
--user USERNAME  Medigate 로그인 ID
--pass PASSWORD  Medigate 로그인 PW
```

## 입력 CSV 형식

```csv
url,json_data
https://t2-new.medigate.net/recruit/1192725,"{""content_id"":1192725,""title"":""..."",... }"
https://t2-new.medigate.net/lease/352759,"{""content_id"":352759,""title"":""..."",... }"
```

## 출력

`reports/` 폴더에 자동 저장:
- `validation_report_YYYYMMDD_HHMMSS.xlsx` - 엑셀 리포트
- `*_요약.csv` - 건별 요약
- `*_상세비교.csv` - 필드별 비교
- `*_불일치항목.csv` - 불일치 항목만

## 필드 매핑

### Recruit (봉직의)

| JSON 필드 | DB 컬럼 | 설명 |
|-----------|---------|------|
| content_id | BOARD_IDX | 콘텐츠ID |
| title | TITLE | 제목 |
| listing_type | INVITE_TYPE | 초빙유형 |
| service_type | SERVICE_TYPE | 서비스유형 |
| specialty.codes | CBIZ_RECJOB_MAP.MAP_CODE | 진료과코드 |
| period.start_date | START_DATE | 시작일 |
| period.end_date | END_DATE | 종료일 |
| recjob_recruit.num | RECRUIT_NUM | 모집인원 |
| recjob_terms.pay_amount | PAY | 급여 |
| recjob_terms.work_hour | WORK_HOUR | 근무시간 |
| recjob_contact.phone | MGR_TEL | 연락처 |
| location.address | COMPANY_ADDR | 주소 |

### Lease (임대)

| JSON 필드 | DB 컬럼 | 설명 |
|-----------|---------|------|
| content_id | board_idx | 콘텐츠ID |
| title | title | 제목 |
| listing_type | lease_type | 임대유형코드 |
| corporation_name | com_name | 중개업소명 |
| lease_property.deposit | secure_money | 보증금 |
| lease_property.monthly_rent | month_price | 월세 |
| lease_property.area_supply | supply_area | 공급면적 |
| lease_property.area_exclusive | private_area | 전용면적 |
| lease_property.floor_current | rent_layer | 현재층 |
| specialty.codes | spc_code | 진료과코드 |
| location.address | address | 주소 |
| period.created_at | reg_date | 등록일 |

### 파생 필드 (Derived)

DB에 코드만 저장되고 OpenSearch에서 명칭으로 변환되는 필드:

| JSON 필드 | 원본 코드 | 설명 |
|-----------|----------|------|
| listing_type_names | listing_type | 임대유형명 |
| dealer_type_name | dealer_type | 중개유형명 |
| specialty.code_names | specialty.codes | 진료과명 |
| service_type_name | service_type | 서비스유형명 |

## 폴더 구조

```
opensearch-schema-validator/
├── docs/                 # 스키마 문서
│   ├── erd_recruit.dbml  # Recruit ERD (dbdiagram.io용)
│   ├── erd_lease.dbml    # Lease ERD (dbdiagram.io용)
│   ├── data_flow.md      # Data Flow 다이어그램 (Mermaid)
│   ├── schema_mapping_template.tsv  # 필드 매핑 (구글시트용)
│   └── code_tables.tsv   # 코드 테이블 (구글시트용)
├── samples/              # 샘플 입력 데이터
├── reports/              # 검증 리포트 출력
├── validator.py          # 메인 실행
├── db_connector.py       # MySQL 연결
├── comparator.py         # 비교 로직
├── excel_reporter.py     # 리포트 생성
├── ui_scraper.py         # UI 스크래퍼
├── config.py             # DB 설정
└── requirements.txt      # 의존성
```

## 스키마 문서

### ERD 다이어그램
[dbdiagram.io](https://dbdiagram.io)에서 시각화:
- `docs/erd_recruit.dbml` - Recruit 테이블 관계도
- `docs/erd_lease.dbml` - Lease 테이블 관계도

### Data Flow
`docs/data_flow.md` - DB → OpenSearch 변환 흐름 (Mermaid 다이어그램)

### 구글 시트용 템플릿
TSV 파일을 구글 시트에 붙여넣기:
- `docs/schema_mapping_template.tsv` - 전체 필드 매핑
- `docs/code_tables.tsv` - 코드 변환 테이블

## DB 설정

> **⚠️ 중요: DB 데이터 보호 정책**
>
> 이 도구는 **READ-ONLY (조회 전용)** 입니다.
>
> - **절대 수정(UPDATE) 불가**
> - **절대 삭제(DELETE) 불가**
> - **절대 삽입(INSERT) 불가**
> - **오로지 SELECT 조회만 가능**
>
> 운영 DB를 직접 연결하므로 데이터 무결성 보장을 위해 모든 쿼리는 SELECT만 사용합니다.
> 코드 수정 시에도 이 원칙을 반드시 준수해야 합니다.

`config.py` 파일에서 DB 연결 정보 설정:

```python
DB_CONFIG = {
    "host": "222.122.26.242",
    "port": 3306,
    "user": "medigate",
    "password": "YOUR_PASSWORD",
    "database": "medigate",
    "charset": "utf8mb4"
}
```

### DB 접근 원칙

```
✅ 허용: SELECT * FROM CBIZ_RECJOB WHERE BOARD_IDX = ?
✅ 허용: SELECT * FROM CBIZ_LEASE WHERE board_idx = ?

❌ 금지: UPDATE, DELETE, INSERT, DROP, ALTER, TRUNCATE
❌ 금지: 트랜잭션 변경 작업
```

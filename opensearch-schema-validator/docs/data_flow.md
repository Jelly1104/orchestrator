# Data Flow Diagram

## DB → OpenSearch 데이터 흐름

```mermaid
flowchart LR
    subgraph MySQL["MySQL DB"]
        R[CBIZ_RECJOB]
        RM[CBIZ_RECJOB_MAP]
        L[CBIZ_LEASE]
        CT[Code Tables]
    end

    subgraph Transform["변환 처리"]
        T1[필드 매핑]
        T2[코드→명칭 변환]
        T3[배열 변환]
        T4[좌표 합성]
    end

    subgraph OpenSearch["OpenSearch Index"]
        OS_R[recruit index]
        OS_L[lease index]
    end

    R --> T1
    RM --> T3
    L --> T1
    CT --> T2

    T1 --> OS_R
    T2 --> OS_R
    T3 --> OS_R

    T1 --> OS_L
    T2 --> OS_L
    T4 --> OS_L
```

## Recruit 변환 상세

```mermaid
flowchart TD
    subgraph DB["DB 원본"]
        A[CBIZ_RECJOB.INVITE_TYPE = 'INVITE_1']
        B[CBIZ_RECJOB.SERVICE_TYPE = 'SERVICE_2']
        C[CBIZ_RECJOB_MAP.MAP_CODE = 'SPC103']
    end

    subgraph CodeJoin["코드 테이블 JOIN"]
        D[CODE_INVITE_TYPE]
        E[CODE_SERVICE_TYPE]
        F[CODE_SPECIALTY]
    end

    subgraph OS["OpenSearch JSON"]
        G["listing_type: 'INVITE_1'<br/>listing_type_name: '봉직의'"]
        H["service_type: 'SERVICE_2'<br/>service_type_name: '프리미엄'"]
        I["specialty.codes: ['SPC103']<br/>specialty.code_names: '내과'"]
    end

    A --> D --> G
    B --> E --> H
    C --> F --> I
```

## Lease 변환 상세

```mermaid
flowchart TD
    subgraph DB["DB 원본"]
        A[lease_type = 'LST001']
        B[dealer_type = '2']
        C["xPos = 127.0101198<br/>yPos = 37.6073767"]
        D[spc_code = 'SPC115']
    end

    subgraph Transform["변환"]
        T1[코드 변환]
        T2[좌표 합성]
        T3[배열 변환]
    end

    subgraph OS["OpenSearch JSON"]
        E["listing_type: 'LST001'<br/>listing_type_names: '임대'"]
        F["dealer_type: '2'<br/>dealer_type_name: '중개거래'"]
        G["coordinates: '37.6073767,127.0101198'"]
        H["specialty.codes: ['SPC115']<br/>specialty.code_names: '이비인후과'"]
    end

    A --> T1 --> E
    B --> T1 --> F
    C --> T2 --> G
    D --> T3 --> H
```

## 파생 필드 (Derived Fields) 목록

| 구분 | JSON 필드 | 원본 | 변환 규칙 |
|------|----------|------|----------|
| Recruit | listing_type_name | INVITE_TYPE | 코드 테이블 JOIN |
| Recruit | service_type_name | SERVICE_TYPE | 코드 테이블 JOIN |
| Recruit | specialty.code_names | MAP_CODE | 코드 테이블 JOIN |
| Lease | listing_type_names | lease_type | 코드 테이블 JOIN |
| Lease | dealer_type_name | dealer_type | 코드 테이블 JOIN |
| Lease | specialty.code_names | spc_code | 코드 테이블 JOIN |
| Lease | location.coordinates | xPos, yPos | 문자열 합성 |

## 주요 불일치 원인

```mermaid
pie title 불일치 유형 분포
    "파생 필드 (Derived)" : 40
    "포맷 차이 (Array/String)" : 20
    "좌표 합성" : 15
    "NULL vs Empty" : 15
    "실제 데이터 불일치" : 10
```

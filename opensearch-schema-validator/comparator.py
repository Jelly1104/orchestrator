"""
Field Comparison Logic for Medigate Validation
DB data vs JSON data comparison
"""
from datetime import datetime
from typing import Any, Dict, List, Tuple


def normalize_value(value: Any) -> str:
    """Normalize value for comparison"""
    if value is None:
        return "NULL"
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, (list, dict)):
        return str(value)
    return str(value).strip()


def normalize_datetime_str(s: str) -> str:
    """Normalize datetime string for comparison (handle ISO 8601)"""
    if not s or s == "NULL":
        return s
    # Try to parse ISO 8601 format: 2025-06-02T10:22:18Z
    try:
        if 'T' in s:
            s = s.replace('Z', '').replace('T', ' ')
            # Remove milliseconds if present
            if '.' in s:
                s = s.split('.')[0]
        return s
    except:
        return s


def is_datetime_field(field: str) -> bool:
    """Check if field is a datetime field"""
    datetime_fields = [
        'period.start_date', 'period.end_date', 'period.created_at', 'period.updated_at',
        'recjob_apply.apply_start_date', 'recjob_apply.apply_end_date'
    ]
    return field in datetime_fields


def compare_values(db_val: Any, json_val: Any, field: str = None) -> Tuple[str, str, bool]:
    """
    Compare DB value and JSON value
    Returns: (normalized_db, normalized_json, is_match)
    """
    db_norm = normalize_value(db_val)
    json_norm = normalize_value(json_val)

    # Handle datetime comparisons (ISO 8601 vs standard format)
    if field and is_datetime_field(field):
        db_dt = normalize_datetime_str(db_norm)
        json_dt = normalize_datetime_str(json_norm)
        is_match = db_dt == json_dt
        return db_norm, json_norm, is_match

    # Handle numeric comparisons
    try:
        db_num = float(db_norm) if db_norm != "NULL" else None
        json_num = float(json_norm) if json_norm != "NULL" else None
        if db_num is not None and json_num is not None:
            is_match = abs(db_num - json_num) < 0.01
            return db_norm, json_norm, is_match
    except (ValueError, TypeError):
        pass

    # String comparison
    is_match = db_norm == json_norm
    return db_norm, json_norm, is_match


def get_nested_value(data: dict, path: str) -> Any:
    """Get nested value from dict using dot notation"""
    keys = path.split('.')
    value = data
    for key in keys:
        if value is None:
            return None
        if isinstance(value, dict):
            value = value.get(key)
        else:
            return None
    return value


# Field mappings: (JSON path, DB column name, description)
RECRUIT_FIELD_MAPPINGS = [
    ("content_id", "BOARD_IDX", "콘텐츠ID"),
    ("title", "TITLE", "제목"),
    ("listing_type", "INVITE_TYPE", "초빙유형"),
    ("listing_type_name", None, "초빙유형명"),  # derived
    ("service_type", "SERVICE_TYPE", "서비스유형"),
    ("service_type_name", None, "서비스유형명"),  # derived

    # specialty
    ("specialty.codes", "specialty_codes", "진료과코드"),
    ("specialty.code_names", None, "진료과명"),  # derived

    # period
    ("period.start_date", "START_DATE", "시작일"),
    ("period.end_date", "END_DATE", "종료일"),
    ("period.created_at", "REG_DATE", "등록일"),
    ("period.updated_at", "MOD_DATE", "수정일"),

    # recjob_apply
    ("recjob_apply.apply_start_date", "START_DATE", "지원시작일"),
    ("recjob_apply.apply_end_date", "END_DATE", "지원종료일"),

    # recjob_recruit
    ("recjob_recruit.num", "RECRUIT_NUM", "모집인원"),
    ("recjob_recruit.career_type", "CAREER_TYPE", "경력유형"),
    ("recjob_recruit.regular_flag", "REGULAR_FLAG", "정규직여부"),

    # recjob_terms
    ("recjob_terms.pay_amount", "PAY", "급여"),
    ("recjob_terms.work_hour", "WORK_HOUR", "근무시간"),
    ("recjob_terms.saturday_hour", "S_WORK_HOUR", "토요일근무시간"),
    ("recjob_terms.saturday_work", "S_WORK_FLAG", "토요일근무여부"),
    ("recjob_terms.holiday_work", "H_WORK_FLAG", "공휴일근무여부"),
    ("recjob_terms.night_work", "NIGHT_WORK_FLAG", "야간근무여부"),

    # recjob_benefits
    ("recjob_benefits.conference_attend", "ATTEND_FLAG", "학회참석"),

    # recjob_org
    ("recjob_org.org_id", "U_ID", "기관ID"),
    ("recjob_org.org_contact_name", "MGR_NAME", "담당자명"),

    # recjob_contact
    ("recjob_contact.phone", "MGR_TEL", "연락처"),

    # location
    ("location.zipcode", "COMPANY_ZIPCODE", "우편번호"),
    ("location.address", "COMPANY_ADDR", "주소"),
]


LEASE_FIELD_MAPPINGS = [
    ("content_id", "board_idx", "콘텐츠ID"),
    ("title", "title", "제목"),
    ("listing_type", "lease_type", "임대유형코드"),
    ("listing_type_names", None, "임대유형명"),  # derived
    ("corporation_name", "com_name", "중개업소명"),

    # lease_property
    ("lease_property.area_supply", "supply_area", "공급면적"),
    ("lease_property.area_exclusive", "private_area", "전용면적"),
    ("lease_property.deposit", "secure_money", "보증금"),
    ("lease_property.monthly_rent", "month_price", "월세"),
    ("lease_property.management_cost", "mng_cost", "관리비"),
    ("lease_property.premium", "premium_price", "권리금"),
    ("lease_property.price", "price", "매매가"),
    ("lease_property.floor_current", "rent_layer", "현재층"),
    ("lease_property.floor_total", "tot_over_layer", "전체층"),
    ("lease_property.floor_underground", "tot_under_layer", "지하층"),
    ("lease_property.dealer_type", "dealer_type", "중개유형"),
    ("lease_property.dealer_type_name", None, "중개유형명"),  # derived

    # specialty
    ("specialty.codes", "spc_code", "진료과코드"),
    ("specialty.code_names", None, "진료과명"),  # derived

    # location
    ("location.address", "address", "주소"),
    ("location.zipcode", "zipcode", "우편번호"),
    ("location.coordinates", None, "좌표"),  # combined from xPos, yPos

    # lease_detail
    ("lease_detail.usage_type_names", "usage_type", "시설정보"),

    # period
    ("period.created_at", "reg_date", "등록일"),
    ("period.updated_at", "mod_date", "수정일"),
]


def compare_recruit(db_data: dict, json_data: dict) -> List[dict]:
    """Compare recruit data"""
    results = []

    for json_path, db_col, description in RECRUIT_FIELD_MAPPINGS:
        json_val = get_nested_value(json_data, json_path)

        if db_col is None:
            # Derived field - no direct DB mapping
            db_val = None
        elif db_col == "specialty_codes":
            db_val = db_data.get('specialty_codes', [])
            # Compare as sorted lists
            if isinstance(json_val, list):
                json_val = sorted(json_val)
            if isinstance(db_val, list):
                db_val = sorted(db_val)
        else:
            db_val = db_data.get(db_col)

        db_norm, json_norm, is_match = compare_values(db_val, json_val, field=json_path)

        results.append({
            "field": json_path,
            "description": description,
            "db_value": db_norm,
            "json_value": json_norm,
            "match": is_match,
            "db_column": db_col or "(derived)"
        })

    return results


def compare_lease(db_data: dict, json_data: dict) -> List[dict]:
    """Compare lease data"""
    results = []

    for json_path, db_col, description in LEASE_FIELD_MAPPINGS:
        json_val = get_nested_value(json_data, json_path)

        if db_col is None:
            db_val = None
        elif db_col == "spc_code":
            # specialty.codes in JSON is a list, but in DB it's a single value
            db_val = db_data.get('spc_code')
            if isinstance(json_val, list) and len(json_val) > 0:
                json_val = json_val[0] if len(json_val) == 1 else json_val
        else:
            db_val = db_data.get(db_col)

        db_norm, json_norm, is_match = compare_values(db_val, json_val, field=json_path)

        results.append({
            "field": json_path,
            "description": description,
            "db_value": db_norm,
            "json_value": json_norm,
            "match": is_match,
            "db_column": db_col or "(derived)"
        })

    return results


def compare_data(content_type: str, db_data: dict, json_data: dict) -> List[dict]:
    """
    Compare DB and JSON data based on content type
    Returns list of comparison results
    """
    if db_data is None:
        return [{
            "field": "ERROR",
            "description": "DB 조회 실패",
            "db_value": "NOT FOUND",
            "json_value": str(json_data.get('content_id', 'N/A')),
            "match": False,
            "db_column": ""
        }]

    if content_type == "recruit":
        return compare_recruit(db_data, json_data)
    elif content_type == "lease":
        return compare_lease(db_data, json_data)
    else:
        return [{
            "field": "ERROR",
            "description": "알 수 없는 콘텐츠 타입",
            "db_value": "",
            "json_value": content_type,
            "match": False,
            "db_column": ""
        }]


def calculate_match_rate(results: List[dict]) -> float:
    """Calculate match rate percentage"""
    if not results:
        return 0.0
    total = len(results)
    matched = sum(1 for r in results if r['match'])
    return round((matched / total) * 100, 1)

#!/usr/bin/env python3
"""
Convert sample_lease.csv to proper url,json_data format
Matches the actual OpenSearch JSON structure
"""
import csv
import json
import re

def parse_row(row):
    """Parse a CSV row and return (content_id, json_data)"""
    # First element is URL or content_id
    first_col = row[0].strip()

    # Extract content_id from URL or use directly
    if first_col.startswith('http'):
        match = re.search(r'/lease/(\d+)', first_col)
        if match:
            content_id = int(match.group(1))
        else:
            # URL without content_id - need to get from somewhere else
            content_id = None
    else:
        # Direct content_id
        try:
            content_id = int(first_col)
        except ValueError:
            content_id = None

    # CSV Column mapping (0-indexed after content_id/url):
    # [1] title
    # [2] empty (unused)
    # [3] listing_type (LST001, LST002)
    # [4] listing_type_names (임대, 양도)
    # [5] corporation_name
    # [6] area_supply
    # [7] area_exclusive
    # [8] monthly_rent
    # [9] deposit
    # [10] premium
    # [11] management_cost
    # [12] floor_current
    # [13] floor_total
    # [14] floor_underground
    # [15] address
    # [16] coordinates
    # [17] specialty_names (comma-separated)
    # [18] created_at (ISO format)
    # [19] updated_at (ISO format)

    def safe_int(val):
        try:
            return int(float(val)) if val else 0
        except (ValueError, TypeError):
            return 0

    def safe_float(val):
        try:
            return float(val) if val else 0.0
        except (ValueError, TypeError):
            return 0.0

    title = row[1].strip() if len(row) > 1 else ""
    listing_type = row[3].strip() if len(row) > 3 else ""
    listing_type_names = row[4].strip() if len(row) > 4 else ""
    corporation_name = row[5].strip() if len(row) > 5 else ""

    area_supply = safe_float(row[6]) if len(row) > 6 else 0
    area_exclusive = safe_float(row[7]) if len(row) > 7 else 0
    monthly_rent = safe_int(row[8]) if len(row) > 8 else 0
    deposit = safe_int(row[9]) if len(row) > 9 else 0
    premium = safe_int(row[10]) if len(row) > 10 else 0
    management_cost = safe_int(row[11]) if len(row) > 11 else 0
    floor_current = safe_int(row[12]) if len(row) > 12 else 0
    floor_total = safe_int(row[13]) if len(row) > 13 else 0
    floor_underground = safe_int(row[14]) if len(row) > 14 else 0

    address = row[15].strip() if len(row) > 15 else ""
    coordinates = row[16].strip() if len(row) > 16 else ""
    specialty_names = row[17].strip() if len(row) > 17 else ""
    created_at = row[18].strip() if len(row) > 18 else ""
    updated_at = row[19].strip() if len(row) > 19 else ""

    # Parse specialty codes from names (we'll need to derive codes)
    specialty_name_list = [s.strip() for s in specialty_names.split(',') if s.strip()]

    # Specialty name to code mapping
    SPECIALTY_CODE_MAP = {
        "가정의학과": "SPC101",
        "결핵과": "SPC102",
        "내과": "SPC103",
        "마취통증의학과": "SPC104",
        "병리과": "SPC105",
        "비뇨의학과": "SPC106",
        "산부인과": "SPC107",
        "성형외과": "SPC108",
        "소아청소년과": "SPC109",
        "신경과": "SPC110",
        "신경외과": "SPC111",
        "안과": "SPC112",
        "영상의학과": "SPC113",
        "외과": "SPC114",
        "이비인후과": "SPC115",
        "일반의": "SPC116",
        "재활의학과": "SPC117",
        "정신건강의학과": "SPC118",
        "정형외과": "SPC119",
        "직업환경의학과": "SPC120",
        "진단검사의학과": "SPC121",
        "피부과": "SPC122",
        "응급의학과": "SPC123",
        "흉부외과": "SPC124",
        "핵의학과": "SPC125",
    }

    specialty_codes = []
    for name in specialty_name_list:
        code = SPECIALTY_CODE_MAP.get(name)
        if code:
            specialty_codes.append(code)

    # Build JSON matching OpenSearch structure
    json_data = {
        "content_id": content_id,
        "title": title,
        "listing_type": listing_type,
        "listing_type_names": listing_type_names,
        "corporation_name": corporation_name,
        "lease_property": {
            "area_supply": area_supply,
            "area_exclusive": area_exclusive,
            "monthly_rent": monthly_rent,
            "deposit": deposit,
            "premium": premium,
            "management_cost": management_cost,
            "floor_current": floor_current,
            "floor_total": floor_total,
            "floor_underground": floor_underground,
            "dealer_type": "2",  # Default to 중개거래
            "dealer_type_name": "중개거래"
        },
        "specialty": {
            "codes": specialty_codes,
            "code_names": specialty_names
        },
        "location": {
            "address": address,
            "coordinates": coordinates
        },
        "period": {
            "created_at": created_at,
            "updated_at": updated_at
        }
    }

    return content_id, json_data


def convert_lease_csv(input_path, output_path):
    """Convert lease CSV to url,json_data format"""
    rows_processed = 0
    rows_skipped = 0

    # Known content_id for first row (URL without ID)
    FIRST_ROW_CONTENT_ID = 351985

    with open(input_path, 'r', encoding='utf-8') as infile, \
         open(output_path, 'w', encoding='utf-8', newline='') as outfile:

        reader = csv.reader(infile)
        writer = csv.writer(outfile, quoting=csv.QUOTE_ALL)

        # Write header
        writer.writerow(['url', 'json_data'])

        for row_num, row in enumerate(reader, 1):
            if not row or not row[0].strip():
                continue

            content_id, json_data = parse_row(row)

            # Handle first row with missing content_id
            if content_id is None and row_num == 1:
                content_id = FIRST_ROW_CONTENT_ID
                json_data['content_id'] = content_id

            if content_id is None:
                print(f"[WARN] Row {row_num}: Could not extract content_id, skipping")
                rows_skipped += 1
                continue

            url = f"https://t2-new.medigate.net/lease/{content_id}"
            json_str = json.dumps(json_data, ensure_ascii=False)

            writer.writerow([url, json_str])
            rows_processed += 1

    print(f"Conversion complete: {rows_processed} rows processed, {rows_skipped} skipped")
    print(f"Output: {output_path}")
    return rows_processed


if __name__ == "__main__":
    import sys

    input_file = sys.argv[1] if len(sys.argv) > 1 else "sample_lease.csv"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "sample_lease_converted.csv"

    convert_lease_csv(input_file, output_file)

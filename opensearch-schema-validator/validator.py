#!/usr/bin/env python3
"""
Medigate DB-JSON-UI Validator
Compares OpenSearch indexed data with MySQL database records and UI

Usage:
    python validator.py input.csv
    python validator.py input.csv --output custom_report.xlsx
    python validator.py input.csv --with-ui --user USERNAME --pass PASSWORD
"""
import sys
import csv
import json
import re
import asyncio
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from db_connector import get_recruit_data, get_lease_data
from comparator import compare_data, calculate_match_rate
from excel_reporter import create_report, generate_report_filename


def parse_url(url: str) -> Tuple[Optional[str], Optional[int]]:
    """
    Parse URL to extract content type and ID

    Examples:
        https://t2-new.medigate.net/recruit/1192725 -> ("recruit", 1192725)
        https://t2-new.medigate.net/lease/351985 -> ("lease", 351985)
    """
    patterns = [
        (r'/recruit/(\d+)', 'recruit'),
        (r'/lease/(\d+)', 'lease'),
    ]

    for pattern, content_type in patterns:
        match = re.search(pattern, url)
        if match:
            content_id = int(match.group(1))
            return content_type, content_id

    return None, None


def read_csv_input(csv_path: str) -> List[Dict]:
    """
    Read CSV input file

    Expected format:
    url,json_data
    https://...,"{...json...}"
    """
    rows = []

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)

        for row_num, row in enumerate(reader, 2):  # Start from 2 (1 is header)
            url = row.get('url', '').strip()
            json_str = row.get('json_data', '').strip()

            if not url:
                print(f"[WARN] Row {row_num}: Empty URL, skipping")
                continue

            try:
                json_data = json.loads(json_str) if json_str else {}
            except json.JSONDecodeError as e:
                print(f"[WARN] Row {row_num}: Invalid JSON - {e}")
                json_data = {"_parse_error": str(e)}

            rows.append({
                "row_num": row_num,
                "url": url,
                "json_data": json_data
            })

    return rows


def validate_single(url: str, json_data: dict, ui_data: dict = None) -> Dict:
    """
    Validate a single URL against JSON data (and optionally UI data)
    """
    content_type, content_id = parse_url(url)

    result = {
        "url": url,
        "content_id": content_id,
        "content_type": content_type,
        "status": "success",
        "error_message": "",
        "match_rate": 0.0,
        "total_fields": 0,
        "matched_fields": 0,
        "mismatched_fields": 0,
        "comparisons": [],
        "ui_enabled": ui_data is not None
    }

    if content_type is None or content_id is None:
        result["status"] = "error"
        result["error_message"] = "URL 파싱 실패"
        return result

    # Get content_id from JSON if available
    json_content_id = json_data.get('content_id')
    if json_content_id and json_content_id != content_id:
        result["status"] = "error"
        result["error_message"] = f"URL content_id({content_id}) != JSON content_id({json_content_id})"
        return result

    # Fetch DB data
    try:
        if content_type == "recruit":
            db_data = get_recruit_data(content_id)
        elif content_type == "lease":
            db_data = get_lease_data(content_id)
        else:
            db_data = None
    except Exception as e:
        result["status"] = "error"
        result["error_message"] = f"DB 조회 오류: {str(e)}"
        return result

    if db_data is None:
        result["status"] = "error"
        result["error_message"] = f"DB에서 데이터를 찾을 수 없음 (content_id: {content_id})"
        return result

    # Compare data (DB vs JSON)
    comparisons = compare_data(content_type, db_data, json_data)

    # Add UI comparison if available
    if ui_data:
        for comp in comparisons:
            field = comp['field']
            ui_value = None

            # Map JSON fields to UI scraped fields
            if field == 'recjob_apply.apply_end_date':
                ui_value = ui_data.get('apply_end_date')
            elif field == 'recjob_apply.apply_start_date':
                ui_value = ui_data.get('apply_start_date')
            elif field == 'location.address':
                ui_value = ui_data.get('address')
            elif field == 'recjob_contact.phone':
                ui_value = ui_data.get('phone')
            elif field == 'recjob_terms.pay_amount':
                ui_value = ui_data.get('pay_amount')

            comp['ui_value'] = ui_value if ui_value else "N/A"

            # Check if UI matches DB
            if ui_value:
                # Normalize for comparison
                db_val = comp['db_value']
                if 'date' in field.lower():
                    # Compare dates
                    db_date = db_val.split(' ')[0] if db_val and db_val != 'NULL' else None
                    comp['ui_match_db'] = db_date == ui_value if db_date else False
                    comp['ui_match_json'] = comp['json_value'].split('T')[0] == ui_value if comp['json_value'] != 'NULL' else False
                else:
                    comp['ui_match_db'] = False
                    comp['ui_match_json'] = False
            else:
                comp['ui_match_db'] = None
                comp['ui_match_json'] = None

    result["comparisons"] = comparisons

    # Calculate stats
    result["total_fields"] = len(comparisons)
    result["matched_fields"] = sum(1 for c in comparisons if c.get('match'))
    result["mismatched_fields"] = result["total_fields"] - result["matched_fields"]
    result["match_rate"] = calculate_match_rate(comparisons)

    return result


async def run_validation_async(csv_path: str, output_path: str = None, with_ui: bool = False, username: str = None, password: str = None):
    """
    Run full validation from CSV input (async version)
    """
    mode = "DB-JSON-UI" if with_ui else "DB-JSON"
    print(f"\n{'='*60}")
    print(f"Medigate {mode} Validator")
    print(f"{'='*60}\n")

    # Read input
    print(f"[INFO] Reading input file: {csv_path}")
    rows = read_csv_input(csv_path)
    print(f"[INFO] Found {len(rows)} rows to validate")
    if with_ui:
        print(f"[INFO] UI scraping enabled")
    print()

    if len(rows) < 10:
        print(f"[WARN] Less than 10 valid rows. Minimum recommended is 10.")

    # Initialize UI scraper if needed
    scraper = None
    if with_ui:
        from ui_scraper import MedigateUIScraper
        scraper = MedigateUIScraper(username, password)
        await scraper.start()
        print(f"[INFO] UI Scraper initialized\n")

    # Validate each row
    results = []
    for i, row in enumerate(rows, 1):
        url = row['url']
        json_data = row['json_data']

        print(f"[{i}/{len(rows)}] Validating: {url[:60]}...")

        # Get UI data if enabled
        ui_data = None
        if scraper:
            try:
                content_type, content_id = parse_url(url)
                if content_type == "recruit":
                    ui_data = await scraper.get_recruit_data(content_id)
                elif content_type == "lease":
                    ui_data = await scraper.get_lease_data(content_id)
                print(f"         -> UI scraped: {len(ui_data)} fields")
            except Exception as e:
                print(f"         -> UI scrape failed: {e}")

        result = validate_single(url, json_data, ui_data)
        results.append(result)

        if result['status'] == 'success':
            print(f"         -> Match rate: {result['match_rate']}% ({result['matched_fields']}/{result['total_fields']})")
        else:
            print(f"         -> ERROR: {result['error_message']}")

    # Close scraper
    if scraper:
        await scraper.close()

    # Generate report
    if output_path is None:
        output_path = generate_report_filename()

    print(f"\n[INFO] Generating report: {output_path}")
    create_report(results, output_path)

    # Print summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    success_count = sum(1 for r in results if r['status'] == 'success')
    error_count = len(results) - success_count
    avg_match_rate = sum(r['match_rate'] for r in results if r['status'] == 'success') / max(success_count, 1)

    print(f"Total processed: {len(results)}")
    print(f"Success: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Average match rate: {avg_match_rate:.1f}%")
    print(f"\nReport saved: {output_path}")
    print(f"{'='*60}\n")


def run_validation(csv_path: str, output_path: str = None, with_ui: bool = False, username: str = None, password: str = None):
    """
    Run full validation from CSV input
    """
    asyncio.run(run_validation_async(csv_path, output_path, with_ui, username, password))


def main():
    if len(sys.argv) < 2:
        print("Usage: python validator.py <input.csv> [options]")
        print("\nOptions:")
        print("  --output FILE      Output report filename")
        print("  --with-ui          Enable UI scraping (3-way comparison)")
        print("  --user USERNAME    Medigate username (required with --with-ui)")
        print("  --pass PASSWORD    Medigate password (required with --with-ui)")
        print("\nCSV format:")
        print("  url,json_data")
        print('  https://t2-new.medigate.net/recruit/1192725,"{""content_id"":1192725,...}"')
        print("\nExamples:")
        print("  python validator.py sample.csv")
        print("  python validator.py sample.csv --with-ui --user test --pass 1234")
        sys.exit(1)

    csv_path = sys.argv[1]
    output_path = None
    with_ui = False
    username = None
    password = None

    # Parse arguments
    args = sys.argv[2:]
    i = 0
    while i < len(args):
        if args[i] == '--output' and i + 1 < len(args):
            output_path = args[i + 1]
            i += 2
        elif args[i] == '--with-ui':
            with_ui = True
            i += 1
        elif args[i] == '--user' and i + 1 < len(args):
            username = args[i + 1]
            i += 2
        elif args[i] == '--pass' and i + 1 < len(args):
            password = args[i + 1]
            i += 2
        else:
            i += 1

    # Validate UI options
    if with_ui and (not username or not password):
        print("[ERROR] --with-ui requires --user and --pass")
        sys.exit(1)

    run_validation(csv_path, output_path, with_ui, username, password)


if __name__ == "__main__":
    main()

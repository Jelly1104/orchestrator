"""
MySQL Database Connector for Medigate Validation
"""
import pymysql
from config import DB_CONFIG, MEMBER_DB_CONFIG


def get_connection(config=DB_CONFIG):
    """Create database connection"""
    return pymysql.connect(
        host=config["host"],
        port=config["port"],
        user=config["user"],
        password=config["password"],
        database=config["database"],
        charset=config["charset"],
        cursorclass=pymysql.cursors.DictCursor
    )


def get_recruit_data(content_id: int) -> dict:
    """
    Get recruit (봉직의) data from CBIZ_RECJOB
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Main recruit data
            sql = """
                SELECT
                    BOARD_IDX, TITLE, INVITE_TYPE, SERVICE_TYPE, U_ID,
                    RECRUIT_NUM, CAREER_TYPE, REGULAR_FLAG, PAY,
                    WORK_HOUR, S_WORK_HOUR, S_WORK_FLAG, H_WORK_FLAG,
                    NIGHT_WORK_FLAG, ATTEND_FLAG,
                    START_DATE, END_DATE, REG_DATE, MOD_DATE,
                    MGR_NAME, MGR_TEL, MGR_MOBILE, MGR_EMAIL,
                    COMPANY_ZIPCODE, COMPANY_ADDR, COUNTRY_ADDR
                FROM CBIZ_RECJOB
                WHERE BOARD_IDX = %s
            """
            cursor.execute(sql, (content_id,))
            main_data = cursor.fetchone()

            if not main_data:
                return None

            # Get specialty codes from mapping table
            sql_map = """
                SELECT MAP_CODE
                FROM CBIZ_RECJOB_MAP
                WHERE BOARD_IDX = %s AND MAP_TYPE = 'SPC'
                ORDER BY MAP_CODE
            """
            cursor.execute(sql_map, (content_id,))
            spc_rows = cursor.fetchall()
            specialty_codes = [row['MAP_CODE'] for row in spc_rows]

            # Get code names
            if specialty_codes:
                placeholders = ','.join(['%s'] * len(specialty_codes))
                sql_codes = f"""
                    SELECT CODE, CODE_NAME
                    FROM CODE_MASTER
                    WHERE CODE IN ({placeholders}) AND KBN = 'SPC'
                """
                cursor.execute(sql_codes, specialty_codes)
                code_names = {row['CODE']: row['CODE_NAME'] for row in cursor.fetchall()}
            else:
                code_names = {}

            main_data['specialty_codes'] = specialty_codes
            main_data['specialty_code_names'] = code_names

            return main_data

    finally:
        conn.close()


def get_lease_data(content_id: int) -> dict:
    """
    Get lease (임대) data from CBIZ_LEASE
    """
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            # Main lease data
            sql = """
                SELECT
                    board_idx, partner_idx, lease_type, title,
                    display_flag, dealer_type,
                    building_name, loc_code, city_code, emd_code,
                    xPos, yPos, zipcode, address,
                    tot_over_layer, tot_under_layer, rent_layer, rent_layer_type,
                    supply_area, private_area,
                    spc_code, spc_treat_code, location_spc,
                    price, price_nego, secure_money, secure_money_nego,
                    month_price, premium_price, premium_price_flag,
                    mng_cost, mng_cost_flag, mng_cost_detail,
                    usage_type, content,
                    mgr_name, mgr_mobile, mgr_tel,
                    reg_date, mod_date
                FROM CBIZ_LEASE
                WHERE board_idx = %s
            """
            cursor.execute(sql, (content_id,))
            main_data = cursor.fetchone()

            if not main_data:
                return None

            # Get partner info
            partner_idx = main_data.get('partner_idx')
            if partner_idx:
                sql_partner = """
                    SELECT mall_type, ent_name, u_name
                    FROM CBIZ_LEASE_PARTNER
                    WHERE partner_idx = %s
                """
                cursor.execute(sql_partner, (partner_idx,))
                partner_data = cursor.fetchone()
                if partner_data:
                    main_data['partner'] = partner_data

            # Get code names for specialty
            spc_code = main_data.get('spc_code')
            if spc_code:
                sql_spc = """
                    SELECT CODE, CODE_NAME
                    FROM CODE_MASTER
                    WHERE CODE = %s AND KBN = 'SPC'
                """
                cursor.execute(sql_spc, (spc_code,))
                spc_row = cursor.fetchone()
                if spc_row:
                    main_data['spc_code_name'] = spc_row['CODE_NAME']

            # Get usage type names
            usage_type = main_data.get('usage_type')
            if usage_type:
                usage_codes = [u.strip() for u in usage_type.split(',')]
                if usage_codes:
                    placeholders = ','.join(['%s'] * len(usage_codes))
                    sql_usage = f"""
                        SELECT CODE, CODE_NAME
                        FROM CODE_MASTER
                        WHERE CODE IN ({placeholders}) AND KBN = 'LEASE_USAGE_TYPE_RENT'
                    """
                    cursor.execute(sql_usage, usage_codes)
                    usage_names = {row['CODE']: row['CODE_NAME'] for row in cursor.fetchall()}
                    main_data['usage_type_names'] = usage_names

            return main_data

    finally:
        conn.close()


def get_code_name(code: str, kbn: str = None) -> str:
    """Get code name from CODE_MASTER"""
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            if kbn:
                sql = "SELECT CODE_NAME FROM CODE_MASTER WHERE CODE = %s AND KBN = %s LIMIT 1"
                cursor.execute(sql, (code, kbn))
            else:
                sql = "SELECT CODE_NAME FROM CODE_MASTER WHERE CODE = %s LIMIT 1"
                cursor.execute(sql, (code,))
            row = cursor.fetchone()
            return row['CODE_NAME'] if row else None
    finally:
        conn.close()


if __name__ == "__main__":
    # Test
    print("Testing recruit data fetch...")
    recruit = get_recruit_data(1192725)
    if recruit:
        print(f"  Title: {recruit['TITLE'][:50]}...")
        print(f"  Specialty codes: {recruit['specialty_codes']}")

    print("\nTesting lease data fetch...")
    lease = get_lease_data(351985)
    if lease:
        print(f"  Title: {lease['title'][:50]}...")
        print(f"  Address: {lease['address']}")

"""
UI Scraper for Medigate using Playwright
Extracts data from actual webpage for 3-way comparison (DB vs JSON vs UI)
"""
import asyncio
from typing import Dict, Optional
from playwright.async_api import async_playwright, Page


class MedigateUIScraper:
    def __init__(self, username: str, password: str, base_url: str = "https://t2-new.medigate.net"):
        self.username = username
        self.password = password
        self.base_url = base_url
        self.browser = None
        self.context = None
        self.page = None
        self.logged_in = False

    async def start(self):
        """Start browser and login"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(headless=True)
        self.context = await self.browser.new_context()
        self.page = await self.context.new_page()
        await self._login()

    async def _login(self):
        """Login to Medigate"""
        login_url = f"{self.base_url}/user/login"
        await self.page.goto(login_url)

        # Wait for login form
        await self.page.wait_for_selector('input[name="usrIdT"]', timeout=10000)

        # Fill credentials
        await self.page.fill('input[name="usrIdT"]', self.username)
        await self.page.fill('input[name="usrPasswdT"]', self.password)

        # Click login button
        await self.page.click('button[type="submit"]')

        # Wait for redirect/login completion
        await self.page.wait_for_load_state('networkidle', timeout=15000)

        self.logged_in = True
        print(f"[UI Scraper] Logged in as {self.username}")

    async def get_recruit_data(self, content_id: int) -> Dict:
        """Scrape recruit page data"""
        if not self.logged_in:
            await self._login()

        url = f"{self.base_url}/recruit/{content_id}"
        await self.page.goto(url)
        await self.page.wait_for_load_state('networkidle', timeout=15000)

        data = {}

        try:
            # Title
            title_el = await self.page.query_selector('h1, .title, [class*="title"]')
            if title_el:
                data['title'] = await title_el.inner_text()

            # Extract structured data from the page
            # These selectors need to be adjusted based on actual page structure
            data.update(await self._extract_recruit_fields())

        except Exception as e:
            data['_error'] = str(e)

        return data

    async def _extract_recruit_fields(self) -> Dict:
        """Extract specific fields from recruit page"""
        fields = {}

        # Get full page text for pattern matching
        page_text = await self.page.inner_text('body')
        lines = page_text.split('\n')

        # Extract application period dates
        import re
        for i, line in enumerate(lines):
            # Pattern: 2025. 10. 13 (월) 시작 ~ 2025. 11. 30 (일)
            date_pattern = r'(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2}).*?[시작~]+.*?(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})'
            match = re.search(date_pattern, line)
            if match:
                start_date = f"{match.group(1)}-{match.group(2).zfill(2)}-{match.group(3).zfill(2)}"
                end_date = f"{match.group(4)}-{match.group(5).zfill(2)}-{match.group(6).zfill(2)}"
                fields['apply_start_date'] = start_date
                fields['apply_end_date'] = end_date
                break

        # Try to find common field patterns
        # 지원 기간 (Application Period)
        try:
            period_text = await self._find_text_by_label(['지원기간', '지원 기간', '모집기간'])
            if period_text:
                fields['recjob_apply_period'] = period_text
        except:
            pass

        # 급여 (Salary)
        try:
            salary_text = await self._find_text_by_label(['급여', '연봉', '월급'])
            if salary_text:
                fields['pay_amount'] = salary_text
        except:
            pass

        # 근무시간 (Work Hours)
        try:
            hours_text = await self._find_text_by_label(['근무시간', '근무 시간'])
            if hours_text:
                fields['work_hour'] = hours_text
        except:
            pass

        # 주소 (Address)
        try:
            addr_text = await self._find_text_by_label(['주소', '근무지', '위치'])
            if addr_text:
                fields['address'] = addr_text
        except:
            pass

        # 연락처 (Contact)
        try:
            phone_text = await self._find_text_by_label(['연락처', '전화', '담당자'])
            if phone_text:
                fields['phone'] = phone_text
        except:
            pass

        # Get full page text for debugging
        fields['_page_text'] = await self.page.inner_text('body')

        return fields

    async def _find_text_by_label(self, labels: list) -> Optional[str]:
        """Find text content by label name"""
        for label in labels:
            # Try different selector patterns
            selectors = [
                f'//*[contains(text(), "{label}")]/following-sibling::*[1]',
                f'//*[contains(text(), "{label}")]/parent::*/following-sibling::*[1]',
                f'//dt[contains(text(), "{label}")]/following-sibling::dd[1]',
                f'//th[contains(text(), "{label}")]/following-sibling::td[1]',
            ]

            for selector in selectors:
                try:
                    el = await self.page.query_selector(f'xpath={selector}')
                    if el:
                        text = await el.inner_text()
                        if text and text.strip():
                            return text.strip()
                except:
                    continue

        return None

    async def get_lease_data(self, content_id: int) -> Dict:
        """Scrape lease page data"""
        if not self.logged_in:
            await self._login()

        url = f"{self.base_url}/lease/{content_id}"
        await self.page.goto(url)
        await self.page.wait_for_load_state('networkidle', timeout=15000)

        data = {}

        try:
            # Title
            title_el = await self.page.query_selector('h1, .title, [class*="title"]')
            if title_el:
                data['title'] = await title_el.inner_text()

            # Extract lease-specific fields
            data.update(await self._extract_lease_fields())

        except Exception as e:
            data['_error'] = str(e)

        return data

    async def _extract_lease_fields(self) -> Dict:
        """Extract specific fields from lease page"""
        fields = {}

        # 보증금 (Deposit)
        try:
            deposit_text = await self._find_text_by_label(['보증금'])
            if deposit_text:
                fields['deposit'] = deposit_text
        except:
            pass

        # 월세 (Monthly Rent)
        try:
            rent_text = await self._find_text_by_label(['월세', '월임대료'])
            if rent_text:
                fields['monthly_rent'] = rent_text
        except:
            pass

        # 면적 (Area)
        try:
            area_text = await self._find_text_by_label(['면적', '전용면적', '공급면적'])
            if area_text:
                fields['area'] = area_text
        except:
            pass

        # 주소 (Address)
        try:
            addr_text = await self._find_text_by_label(['주소', '위치', '소재지'])
            if addr_text:
                fields['address'] = addr_text
        except:
            pass

        # Get full page text for debugging
        fields['_page_text'] = await self.page.inner_text('body')

        return fields

    async def close(self):
        """Close browser"""
        if self.browser:
            await self.browser.close()
            print("[UI Scraper] Browser closed")


async def scrape_url(url: str, username: str, password: str) -> Dict:
    """Scrape a single URL and return extracted data"""
    import re

    # Determine base URL
    if 't2-new' in url:
        base_url = "https://t2-new.medigate.net"
    else:
        base_url = "https://new.medigate.net"

    scraper = MedigateUIScraper(username, password, base_url)

    try:
        await scraper.start()

        # Parse URL to get content type and ID
        recruit_match = re.search(r'/recruit/(\d+)', url)
        lease_match = re.search(r'/lease/(\d+)', url)

        if recruit_match:
            content_id = int(recruit_match.group(1))
            data = await scraper.get_recruit_data(content_id)
        elif lease_match:
            content_id = int(lease_match.group(1))
            data = await scraper.get_lease_data(content_id)
        else:
            data = {'_error': 'Unknown URL pattern'}

        return data

    finally:
        await scraper.close()


def get_ui_data(url: str, username: str, password: str) -> Dict:
    """Synchronous wrapper for scraping"""
    return asyncio.run(scrape_url(url, username, password))


# Test function
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 4:
        print("Usage: python ui_scraper.py <url> <username> <password>")
        sys.exit(1)

    url = sys.argv[1]
    username = sys.argv[2]
    password = sys.argv[3]

    result = get_ui_data(url, username, password)
    print("\n=== Scraped Data ===")
    for key, value in result.items():
        if key != '_page_text':
            print(f"{key}: {value}")

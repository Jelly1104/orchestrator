"""
기상청 기후정보포털 API 클라이언트
https://climate.gg.go.kr/ols/api 데이터 활용
"""
import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from loguru import logger


class WeatherAPIClient:
    """기상청 API 클라이언트"""

    BASE_URL = "https://climate.gg.go.kr/ols/api"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()

    async def get_heatwave_data(self, region: str = None, days: int = 7) -> Dict:
        """
        폭염 데이터 조회

        Args:
            region: 지역 코드 (예: "11" for 서울)
            days: 조회 일수

        Returns:
            폭염 데이터 dict
        """
        try:
            # 실제 API 엔드포인트는 문서 확인 필요
            # 여기서는 예시 구조로 작성
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            params = {
                "startDate": start_date.strftime("%Y%m%d"),
                "endDate": end_date.strftime("%Y%m%d"),
            }

            if region:
                params["region"] = region

            if self.api_key:
                params["apiKey"] = self.api_key

            # Mock data for development
            # 실제로는 API 호출: response = await self.client.get(f"{self.BASE_URL}/heatwave", params=params)

            logger.info(f"Fetching heatwave data for region: {region}")

            # Mock response
            mock_data = self._get_mock_heatwave_data(region)
            return mock_data

        except Exception as e:
            logger.error(f"Failed to fetch heatwave data: {e}")
            raise

    async def get_regional_statistics(self) -> List[Dict]:
        """
        전국 지역별 폭염 통계 조회

        Returns:
            지역별 통계 리스트
        """
        try:
            regions = [
                {"code": "11", "name": "서울"},
                {"code": "26", "name": "부산"},
                {"code": "27", "name": "대구"},
                {"code": "28", "name": "인천"},
                {"code": "29", "name": "광주"},
                {"code": "30", "name": "대전"},
                {"code": "31", "name": "울산"},
                {"code": "41", "name": "경기"},
                {"code": "42", "name": "강원"},
                {"code": "43", "name": "충북"},
                {"code": "44", "name": "충남"},
                {"code": "45", "name": "전북"},
                {"code": "46", "name": "전남"},
                {"code": "47", "name": "경북"},
                {"code": "48", "name": "경남"},
                {"code": "50", "name": "제주"},
            ]

            results = []
            for region in regions:
                data = await self.get_heatwave_data(region["code"], days=7)
                results.append({
                    "region_code": region["code"],
                    "region_name": region["name"],
                    "data": data
                })

            return results

        except Exception as e:
            logger.error(f"Failed to fetch regional statistics: {e}")
            raise

    async def get_risk_level(self, region_code: str) -> Dict:
        """
        지역별 폭염 위험도 계산

        Args:
            region_code: 지역 코드

        Returns:
            위험도 정보
        """
        try:
            data = await self.get_heatwave_data(region_code, days=7)

            # 위험도 계산 로직
            avg_temp = data.get("average_temperature", 0)
            max_temp = data.get("max_temperature", 0)
            heatwave_days = data.get("heatwave_days", 0)

            # 간단한 위험도 계산
            risk_score = 0
            if max_temp >= 35:
                risk_score += 40
            elif max_temp >= 33:
                risk_score += 30
            elif max_temp >= 31:
                risk_score += 20

            risk_score += min(heatwave_days * 10, 40)

            if avg_temp >= 28:
                risk_score += 20

            # 위험 등급
            if risk_score >= 80:
                level = "매우 높음"
                color = "red"
            elif risk_score >= 60:
                level = "높음"
                color = "orange"
            elif risk_score >= 40:
                level = "보통"
                color = "yellow"
            else:
                level = "낮음"
                color = "green"

            return {
                "region_code": region_code,
                "risk_score": risk_score,
                "risk_level": level,
                "color": color,
                "avg_temperature": avg_temp,
                "max_temperature": max_temp,
                "heatwave_days": heatwave_days,
            }

        except Exception as e:
            logger.error(f"Failed to calculate risk level: {e}")
            raise

    def _get_mock_heatwave_data(self, region_code: str = None) -> Dict:
        """Mock 폭염 데이터 생성 (개발용) - 계절별 온도 반영"""
        import random

        # 현재 월 기준으로 계절별 온도 범위 설정
        current_month = datetime.now().month

        if current_month in [12, 1, 2]:  # 겨울
            avg_range = (-5, 10)
            max_range = (-2, 15)
            min_range = (-10, 5)
            heatwave_days = 0
            warnings = []
        elif current_month in [3, 4, 5]:  # 봄
            avg_range = (10, 25)
            max_range = (15, 28)
            min_range = (5, 20)
            heatwave_days = random.randint(0, 2)
            warnings = random.choice([[], ["폭염주의보"]]) if current_month == 5 else []
        elif current_month in [6, 7, 8]:  # 여름 (폭염 시즌)
            avg_range = (25, 32)
            max_range = (30, 38)
            min_range = (20, 28)
            heatwave_days = random.randint(0, 7)
            warnings = random.choice([
                [],
                ["폭염주의보"],
                ["폭염경보"],
                ["폭염주의보", "열대야"]
            ])
        else:  # 가을 (9, 10, 11월)
            avg_range = (10, 25)
            max_range = (15, 28)
            min_range = (5, 20)
            heatwave_days = random.randint(0, 1) if current_month == 9 else 0
            warnings = random.choice([[], ["폭염주의보"]]) if current_month == 9 else []

        avg_temp = round(random.uniform(*avg_range), 1)
        max_temp = round(random.uniform(*max_range), 1)
        min_temp = round(random.uniform(*min_range), 1)

        return {
            "region_code": region_code or "11",
            "average_temperature": avg_temp,
            "max_temperature": max_temp,
            "min_temperature": min_temp,
            "heatwave_days": heatwave_days,
            "humidity": round(random.uniform(50, 80), 1),
            "heat_index": round(max_temp + random.uniform(-2, 5), 1),
            "vulnerable_population": random.randint(1000, 50000),
            "cooling_centers": random.randint(5, 50),
            "warnings": warnings,
            "forecast": {
                "today": max_temp,
                "tomorrow": round(max_temp + random.uniform(-3, 3), 1),
                "day_after": round(max_temp + random.uniform(-5, 5), 1),
            }
        }


# Singleton instance
_weather_client = None


async def get_weather_client() -> WeatherAPIClient:
    """Get or create weather API client singleton"""
    global _weather_client
    if _weather_client is None:
        _weather_client = WeatherAPIClient()
    return _weather_client


if __name__ == "__main__":
    import asyncio

    async def test():
        client = WeatherAPIClient()

        print("Testing heatwave data...")
        data = await client.get_heatwave_data("11")  # 서울
        print(f"Heatwave data: {data}")

        print("\nTesting risk level...")
        risk = await client.get_risk_level("11")
        print(f"Risk level: {risk}")

        await client.close()

    asyncio.run(test())

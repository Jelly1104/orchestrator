"""
LightRAG Service for Heatwave Analysis
Graph-based RAG를 활용한 폭염 위험 분석
"""
import os
from typing import Dict, List, Optional
from loguru import logger

try:
    from lightrag import LightRAG, QueryParam
    from lightrag.llm import openai_complete_if_cache, openai_embedding
    LIGHTRAG_AVAILABLE = True
except ImportError:
    LIGHTRAG_AVAILABLE = False
    logger.warning("LightRAG not installed. Install with: pip install lightrag-hku")


class LightRAGService:
    """LightRAG를 활용한 폭염 분석 서비스"""

    def __init__(self, working_dir: str = "./rag_storage", openai_api_key: str = None):
        if not LIGHTRAG_AVAILABLE:
            raise ImportError("LightRAG is not installed")

        self.working_dir = working_dir
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")

        if not self.openai_api_key:
            raise ValueError("OpenAI API key is required for LightRAG")

        # Initialize LightRAG
        self.rag = LightRAG(
            working_dir=self.working_dir,
            llm_model_func=openai_complete_if_cache,
            embedding_func=openai_embedding,
        )

        logger.info(f"LightRAG initialized with working_dir: {self.working_dir}")

    async def insert_heatwave_data(self, data: Dict) -> bool:
        """
        폭염 데이터를 RAG에 삽입

        Args:
            data: 폭염 데이터 dict

        Returns:
            성공 여부
        """
        try:
            # Convert data to text document
            document = self._format_heatwave_document(data)

            # Insert into RAG
            self.rag.insert(document)

            logger.info(f"Inserted heatwave data for region {data.get('region_code')}")
            return True

        except Exception as e:
            logger.error(f"Failed to insert data: {e}")
            return False

    async def query(self, question: str, mode: str = "hybrid") -> str:
        """
        RAG 쿼리 수행

        Args:
            question: 질문
            mode: 쿼리 모드 (naive, local, global, hybrid)

        Returns:
            답변
        """
        try:
            # Query RAG
            result = self.rag.query(
                question,
                param=QueryParam(mode=mode)
            )

            logger.info(f"Query executed: {question[:50]}...")
            return result

        except Exception as e:
            logger.error(f"Query failed: {e}")
            return f"Error: {str(e)}"

    async def analyze_risk(self, region_data: Dict) -> Dict:
        """
        지역 폭염 위험도 분석

        Args:
            region_data: 지역 폭염 데이터

        Returns:
            분석 결과
        """
        try:
            region_name = region_data.get("region_name", "Unknown")
            max_temp = region_data.get("max_temperature", 0)
            heatwave_days = region_data.get("heatwave_days", 0)

            # RAG query for analysis
            question = f"""
            {region_name} 지역의 폭염 상황을 분석해주세요.
            - 최고 기온: {max_temp}°C
            - 폭염 일수: {heatwave_days}일

            다음을 포함해서 답변해주세요:
            1. 위험도 평가
            2. 취약 계층에 대한 권고사항
            3. 예방 조치
            """

            analysis = await self.query(question, mode="hybrid")

            return {
                "region": region_name,
                "analysis": analysis,
                "max_temp": max_temp,
                "heatwave_days": heatwave_days,
            }

        except Exception as e:
            logger.error(f"Risk analysis failed: {e}")
            return {
                "region": region_data.get("region_name"),
                "analysis": f"분석 실패: {str(e)}",
                "error": True
            }

    async def get_recommendations(self, risk_level: str) -> List[str]:
        """
        위험도에 따른 권장사항 제공

        Args:
            risk_level: 위험 등급 (낮음, 보통, 높음, 매우 높음)

        Returns:
            권장사항 리스트
        """
        try:
            question = f"{risk_level} 등급의 폭염 상황에서 주민들이 취해야 할 행동 지침을 5가지 알려주세요."

            recommendations_text = await self.query(question, mode="local")

            # Parse recommendations (simple split)
            recommendations = [
                line.strip()
                for line in recommendations_text.split("\n")
                if line.strip() and not line.strip().startswith("#")
            ][:5]

            return recommendations

        except Exception as e:
            logger.error(f"Failed to get recommendations: {e}")
            return [
                "충분한 수분을 섭취하세요.",
                "무더운 시간대(12-17시)에는 외출을 자제하세요.",
                "시원한 장소에서 휴식을 취하세요.",
                "어르신과 어린이는 특히 주의하세요.",
                "열대야 시 창문을 열어 환기하세요."
            ]

    def _format_heatwave_document(self, data: Dict) -> str:
        """폭염 데이터를 문서 형식으로 변환"""
        region = data.get("region_name", "Unknown")
        region_code = data.get("region_code", "")
        avg_temp = data.get("average_temperature", 0)
        max_temp = data.get("max_temperature", 0)
        heatwave_days = data.get("heatwave_days", 0)
        humidity = data.get("humidity", 0)
        warnings = data.get("warnings", [])

        doc = f"""
        지역: {region} ({region_code})
        평균 기온: {avg_temp}°C
        최고 기온: {max_temp}°C
        폭염 일수: {heatwave_days}일
        습도: {humidity}%
        경보: {', '.join(warnings) if warnings else '없음'}

        {region}은 최근 {heatwave_days}일간 폭염이 발생했습니다.
        최고 기온은 {max_temp}°C까지 올라갔으며, 평균 습도는 {humidity}%입니다.
        """

        if warnings:
            doc += f"\n현재 {', '.join(warnings)}이(가) 발효 중입니다."

        return doc.strip()


# Singleton instance
_rag_service = None


def get_rag_service(working_dir: str = "./rag_storage") -> Optional[LightRAGService]:
    """Get or create RAG service singleton"""
    global _rag_service

    if not LIGHTRAG_AVAILABLE:
        logger.warning("LightRAG not available, returning None")
        return None

    if _rag_service is None:
        try:
            _rag_service = LightRAGService(working_dir=working_dir)
        except Exception as e:
            logger.error(f"Failed to initialize RAG service: {e}")
            return None

    return _rag_service


if __name__ == "__main__":
    import asyncio

    async def test():
        try:
            service = LightRAGService(working_dir="./test_rag_storage")

            # Test data insertion
            test_data = {
                "region_name": "서울",
                "region_code": "11",
                "average_temperature": 31.5,
                "max_temperature": 36.2,
                "heatwave_days": 5,
                "humidity": 65.0,
                "warnings": ["폭염경보"]
            }

            print("Inserting test data...")
            await service.insert_heatwave_data(test_data)

            print("\nQuerying...")
            result = await service.query("서울의 폭염 상황은 어떤가요?")
            print(f"Result: {result}")

            print("\nGetting recommendations...")
            recommendations = await service.get_recommendations("높음")
            for i, rec in enumerate(recommendations, 1):
                print(f"{i}. {rec}")

        except Exception as e:
            print(f"Test failed: {e}")

    asyncio.run(test())

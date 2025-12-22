"""
Heatwave Risk Dashboard - FastAPI Backend
LightRAG를 활용한 폭염 위험 분석 API
"""
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from loguru import logger

from weather_api import get_weather_client, WeatherAPIClient
from lightrag_service import get_rag_service, LightRAGService


# FastAPI app
app = FastAPI(
    title="Heatwave Risk Dashboard API",
    description="폭염 위험 동네 대시보드 - LightRAG 기반",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class HeatwaveData(BaseModel):
    region_code: str
    region_name: Optional[str] = None
    average_temperature: float
    max_temperature: float
    min_temperature: float
    heatwave_days: int
    humidity: float
    heat_index: float
    warnings: List[str]


class RiskLevel(BaseModel):
    region_code: str
    risk_score: int
    risk_level: str
    color: str
    avg_temperature: float
    max_temperature: float
    heatwave_days: int


class RAGQueryRequest(BaseModel):
    question: str
    mode: str = "hybrid"


class RAGAnalysisResponse(BaseModel):
    region: str
    analysis: str
    max_temp: float
    heatwave_days: int


# Global clients
weather_client: Optional[WeatherAPIClient] = None
rag_service: Optional[LightRAGService] = None


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    global weather_client, rag_service

    logger.info("Starting Heatwave Dashboard API...")

    # Initialize weather client
    weather_client = await get_weather_client()
    logger.info("Weather API client initialized")

    # Initialize RAG service
    try:
        rag_service = get_rag_service(working_dir="./rag_storage")
        if rag_service:
            logger.info("LightRAG service initialized")
        else:
            logger.warning("LightRAG service not available")
    except Exception as e:
        logger.error(f"Failed to initialize RAG service: {e}")
        rag_service = None


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if weather_client:
        await weather_client.close()
    logger.info("Shutdown complete")


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "weather_api": weather_client is not None,
        "rag_service": rag_service is not None
    }


# Weather API endpoints
@app.get("/api/heatwave/data")
async def get_heatwave_data(
    region: Optional[str] = Query(None, description="지역 코드 (예: 11 for 서울)"),
    days: int = Query(7, ge=1, le=30, description="조회 일수")
):
    """
    특정 지역의 폭염 데이터 조회
    """
    try:
        if not weather_client:
            raise HTTPException(status_code=503, detail="Weather API client not initialized")

        data = await weather_client.get_heatwave_data(region, days)
        return {"success": True, "data": data}

    except Exception as e:
        logger.error(f"Failed to get heatwave data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/heatwave/regions")
async def get_all_regions():
    """
    전국 지역별 폭염 통계 조회
    """
    try:
        if not weather_client:
            raise HTTPException(status_code=503, detail="Weather API client not initialized")

        data = await weather_client.get_regional_statistics()
        return {"success": True, "regions": data}

    except Exception as e:
        logger.error(f"Failed to get regional statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/risk/level")
async def get_risk_level(
    region: str = Query(..., description="지역 코드")
):
    """
    특정 지역의 폭염 위험도 조회
    """
    try:
        if not weather_client:
            raise HTTPException(status_code=503, detail="Weather API client not initialized")

        risk = await weather_client.get_risk_level(region)
        return {"success": True, "risk": risk}

    except Exception as e:
        logger.error(f"Failed to calculate risk level: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/risk/dashboard")
async def get_dashboard():
    """
    전국 폭염 위험도 대시보드 데이터
    """
    try:
        if not weather_client:
            raise HTTPException(status_code=503, detail="Weather API client not initialized")

        # Get all regions data
        regions_data = await weather_client.get_regional_statistics()

        # Calculate risk for each region
        dashboard = []
        for region_info in regions_data:
            region_code = region_info["region_code"]
            region_name = region_info["region_name"]

            risk = await weather_client.get_risk_level(region_code)

            dashboard.append({
                "region_code": region_code,
                "region_name": region_name,
                "risk_level": risk["risk_level"],
                "risk_score": risk["risk_score"],
                "color": risk["color"],
                "max_temperature": risk["max_temperature"],
                "heatwave_days": risk["heatwave_days"]
            })

        # Sort by risk score (highest first)
        dashboard.sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "success": True,
            "dashboard": dashboard,
            "total_regions": len(dashboard),
            "high_risk_count": len([d for d in dashboard if d["risk_score"] >= 60])
        }

    except Exception as e:
        logger.error(f"Failed to generate dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# RAG endpoints
@app.post("/api/rag/query")
async def rag_query(request: RAGQueryRequest):
    """
    RAG 쿼리 수행
    """
    try:
        if not rag_service:
            # RAG not available, return fallback
            return {
                "success": False,
                "answer": "RAG 서비스를 사용할 수 없습니다. OpenAI API 키를 설정해주세요.",
                "rag_available": False
            }

        answer = await rag_service.query(request.question, mode=request.mode)

        return {
            "success": True,
            "question": request.question,
            "answer": answer,
            "mode": request.mode,
            "rag_available": True
        }

    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/rag/analyze")
async def rag_analyze_region(region_code: str = Query(..., description="지역 코드")):
    """
    RAG를 활용한 지역 폭염 위험 분석
    """
    try:
        if not rag_service:
            return {
                "success": False,
                "message": "RAG 서비스를 사용할 수 없습니다.",
                "rag_available": False
            }

        if not weather_client:
            raise HTTPException(status_code=503, detail="Weather API client not initialized")

        # Get region data
        region_data = await weather_client.get_heatwave_data(region_code, days=7)

        # Analyze with RAG
        analysis = await rag_service.analyze_risk(region_data)

        return {
            "success": True,
            "analysis": analysis,
            "rag_available": True
        }

    except Exception as e:
        logger.error(f"RAG analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/rag/recommendations")
async def get_recommendations(
    risk_level: str = Query("보통", description="위험 등급 (낮음, 보통, 높음, 매우 높음)")
):
    """
    위험도에 따른 권장사항 조회
    """
    try:
        if not rag_service:
            # Fallback recommendations
            default_recommendations = [
                "충분한 수분을 섭취하세요.",
                "무더운 시간대(12-17시)에는 외출을 자제하세요.",
                "시원한 장소에서 휴식을 취하세요.",
                "어르신과 어린이는 특히 주의하세요.",
                "열대야 시 창문을 열어 환기하세요."
            ]

            return {
                "success": True,
                "recommendations": default_recommendations,
                "risk_level": risk_level,
                "rag_available": False
            }

        recommendations = await rag_service.get_recommendations(risk_level)

        return {
            "success": True,
            "recommendations": recommendations,
            "risk_level": risk_level,
            "rag_available": True
        }

    except Exception as e:
        logger.error(f"Failed to get recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

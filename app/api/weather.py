"""
天气 API
"""
from fastapi import APIRouter, Query
from app.services.weather_service import get_weather, get_weather_sync

router = APIRouter()


@router.get("/weather")
async def get_current_weather(city: str = Query(default="北京", description="城市名称")):
    """
    获取实时天气信息
    
    Args:
        city: 城市名称，默认北京
        
    Returns:
        dict: 天气信息
    """
    weather_data = await get_weather(city)
    return {
        "success": True,
        "data": weather_data
    }


@router.get("/weather/simple")
def get_simple_weather(city: str = Query(default="北京", description="城市名称")):
    """
    获取详细版天气信息（用于小程序）
    
    Args:
        city: 城市名称，默认北京
        
    Returns:
        dict: 详细天气信息
    """
    weather_data = get_weather_sync(city)
    return {
        "success": True,
        "data": weather_data
    }

"""
位置服务 API
"""
from fastapi import APIRouter
from pydantic import BaseModel
import httpx
from app.core.config import settings

router = APIRouter()

class LocationRequest(BaseModel):
    latitude: float
    longitude: float


@router.post("/location/city")
async def get_city_from_location(req: LocationRequest):
    """
    根据经纬度获取城市名称
    
    Args:
        latitude: 纬度
        longitude: 经度
        
    Returns:
        dict: 城市名称
    """
    try:
        # 使用高德地图逆地理编码 API
        api_key = settings.AMAP_API_KEY
        url = "https://restapi.amap.com/v3/geocode/regeo"
        
        params = {
            "location": f"{req.longitude},{req.latitude}",
            "key": api_key,
            "extensions": "base"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            result = response.json()
            
            print(f"高德地图 API 响应：{result}")
            
            if result.get('status') == '1' and result.get('regeocode'):
                city = result['regeocode']['addressComponent'].get('city', '北京')
                # 如果是直辖市，直接取城市名
                if city in ['北京市', '上海市', '天津市', '重庆市']:
                    city = city.replace('市', '')
                
                return {
                    "success": True,
                    "city": city,
                    "province": result['regeocode']['addressComponent'].get('province', '')
                }
            else:
                print(f"高德地图 API 调用失败：{result}")
                return {
                    "success": False,
                    "city": "北京",
                    "message": result.get('info', '无法获取城市信息')
                }
                
    except Exception as e:
        print(f"获取城市失败：{e}")
        import traceback
        print(traceback.format_exc())
        return {
            "success": False,
            "city": "北京",
            "message": str(e)
        }

"""
天气服务模块
使用高德地图天气 API（临时方案，墨迹天气API需要确认正确端点）
"""
import httpx
from datetime import datetime
from app.core.config import settings


async def get_weather(city: str = "张家界") -> dict:
    """
    获取天气信息
    
    Args:
        city: 城市名称
        
    Returns:
        dict: 天气信息
    """
    try:
        api_key = settings.AMAP_API_KEY
        base_url = "https://restapi.amap.com/v3/weather/weatherInfo"
        
        search_city = city
        if "张家界" in city:
            search_city = "430800"
            
        params = {
            "city": search_city,
            "key": api_key,
            "extensions": "all"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(base_url, params=params)
            result = response.json()
            
            print(f"高德天气 API 响应：{result}")
            
            if result.get('status') == '1' and result.get('lives'):
                live = result['lives'][0]
                forecasts = result.get('forecasts', [])
                
                forecast = forecasts[0] if forecasts else {}
                casts = forecast.get('casts', []) if isinstance(forecast, dict) else []
                
                return {
                    "city": live.get('city', city),
                    "weather": live.get('weather', '未知'),
                    "temperature": live.get('temperature', '0'),
                    "humidity": live.get('humidity', '0'),
                    "winddirection": live.get('winddirection', '无风向'),
                    "windpower": live.get('windpower', '0'),
                    "report_time": live.get('reporttime', ''),
                    "weather_icon": get_weather_icon(live.get('weather', '')),
                    "forecasts": casts[:3] if casts else []
                }
            else:
                print(f"高德天气 API 调用失败，返回默认天气")
                return get_default_weather(city)
                
    except Exception as e:
        print(f"获取天气失败：{e}")
        import traceback
        print(traceback.format_exc())
        return get_default_weather(city)


def get_weather_icon(weather_text: str) -> str:
    """根据天气状况返回对应的 emoji 图标"""
    weather_icons = {
        "晴": "☀️",
        "晴间多云": "⛅",
        "多云": "☁️",
        "阴": "☁️",
        "阵雨": "🌦️",
        "雷阵雨": "⛈️",
        "雷阵雨伴有冰雹": "⛈️",
        "小雨": "🌧️",
        "中雨": "🌧️",
        "大雨": "🌧️",
        "暴雨": "⛈️",
        "大暴雨": "⛈️",
        "特大暴雨": "⛈️",
        "小雪": "🌨️",
        "中雪": "🌨️",
        "大雪": "❄️",
        "暴雪": "❄️",
        "雾": "🌫️",
        "霾": "😷",
        "扬沙": "💨",
        "沙尘暴": "💨",
        "强沙尘暴": "💨",
        "浮尘": "💨",
    }
    
    for key, icon in weather_icons.items():
        if key in weather_text:
            return icon
    
    return "🌤️"


def get_default_weather(city: str = "张家界") -> dict:
    """返回默认天气信息（API 调用失败时使用）"""
    return {
        "city": city,
        "weather": "多云",
        "temperature": "22",
        "humidity": "65",
        "winddirection": "东南风",
        "windpower": "1",
        "report_time": "",
        "weather_icon": "☁️",
        "forecasts": []
    }


def get_weather_sync(city: str = "张家界") -> dict:
    """
    获取天气信息（同步版本）
    """
    try:
        api_key = settings.AMAP_API_KEY
        base_url = "https://restapi.amap.com/v3/weather/weatherInfo"
        
        search_city = city
        if "张家界" in city:
            search_city = "430800"
            
        print(f"查询天气，城市：{city} (编码: {search_city})，API Key：{api_key[:10]}...")
        
        params = {
            "city": search_city,
            "key": api_key,
            "extensions": "all"
        }
        
        with httpx.Client() as client:
            response = client.get(base_url, params=params)
            result = response.json()
            
            print(f"高德天气 API 响应：{result}")
            
            if result.get('status') == '1' and result.get('lives'):
                live = result['lives'][0]
                forecasts = result.get('forecasts', [])
                forecast = forecasts[0] if forecasts else None
                casts = forecast.get('casts', []) if forecast else []
                
                return {
                    "city": live.get('city', city),
                    "weather": live.get('weather', '未知'),
                    "temperature": live.get('temperature', '0'),
                    "humidity": live.get('humidity', '0'),
                    "winddirection": live.get('winddirection', '无风向'),
                    "windpower": live.get('windpower', '0'),
                    "report_time": live.get('reporttime', ''),
                    "weather_icon": get_weather_icon(live.get('weather', '')),
                    "forecasts": casts[:3] if casts else []
                }
            else:
                print(f"高德天气 API 调用失败，返回默认天气")
                return get_default_weather()
                
    except Exception as e:
        print(f"获取天气失败：{e}")
        import traceback
        print(traceback.format_exc())
        return get_default_weather()

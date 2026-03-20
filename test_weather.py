"""
测试墨迹天气 API
"""
import httpx

# 测试墨迹天气 API
appcode = "92c76b12080b4d6a88bd90ecf8c73361"

# 尝试多个可能的 API 端点
test_urls = [
    "https://jisutqybmf.market.alicloudapi.com/weather/query",
    "https://weatherbit.api.gov.bz/v3/weather/now.json",
    "https://ali-weather.market.alicloudapi.com/whapi/json/aliweather/limit",
]

city = "张家界"

for url in test_urls:
    print(f"\n测试 API: {url}")
    try:
        headers = {
            "Authorization": f"APPCODE {appcode}"
        }
        
        params = {
            "city": city
        }
        
        with httpx.Client() as client:
            response = client.get(url, params=params, headers=headers, timeout=10)
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text[:500]}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"解析后的JSON: {data}")
                except Exception as e:
                    print(f"JSON解析失败: {e}")
                    
    except Exception as e:
        print(f"请求失败: {e}")

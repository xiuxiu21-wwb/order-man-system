import requests
import json
from app.core.config import settings

# 直接测试聚合数据 API
api_key = settings.NEWS_API_KEY
api_url = settings.NEWS_API_URL

params = {
    "key": api_key,
    "type": "top"
}

print(f"请求聚合数据 API: {api_url}")
print(f"参数：{params}")

try:
    response = requests.get(api_url, params=params, timeout=15)
    print(f"\n状态码：{response.status_code}")
    result = response.json()
    print(f"\n完整响应:")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    
    if result.get("reason") == "success" and result.get("result", {}).get("data"):
        news_list = result["result"]["data"]
        print(f"\n获取到 {len(news_list)} 条新闻")
        
        for i, item in enumerate(news_list[:5], 1):
            print(f"\n新闻 {i}:")
            print(f"  标题：{item.get('title', 'N/A')}")
            print(f"  摘要：{item.get('digest', 'N/A')[:50] if item.get('digest') else 'N/A'}...")
            print(f"  来源：{item.get('author_name', 'N/A')}")
            print(f"  时间：{item.get('mtime', 'N/A')}")
            print(f"  图片：{item.get('thumbnail_str', 'N/A')[:100] if item.get('thumbnail_str') else 'N/A'}...")
    else:
        print(f"\nAPI 返回失败：{result}")
except Exception as e:
    print(f"错误：{e}")
    import traceback
    traceback.print_exc()

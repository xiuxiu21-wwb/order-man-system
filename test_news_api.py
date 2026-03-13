import requests
import json

# 测试新闻 API
url = "http://127.0.0.1:8000/api/news/list"
params = {"page": 1, "page_size": 10}

try:
    print(f"正在请求：{url}")
    response = requests.get(url, params=params, timeout=30)
    print(f"状态码：{response.status_code}")
    print(f"\n响应数据:")
    data = response.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
    
    if "news" in data:
        print(f"\n新闻数量：{len(data['news'])}")
        for i, news in enumerate(data["news"][:5], 1):
            print(f"\n新闻 {i}:")
            print(f"  标题：{news.get('title', 'N/A')}")
            print(f"  描述：{news.get('description', 'N/A')[:50] if news.get('description') else 'N/A'}...")
            print(f"  来源：{news.get('source', 'N/A')}")
            print(f"  时间：{news.get('time', 'N/A')}")
except Exception as e:
    print(f"错误：{e}")
    import traceback
    traceback.print_exc()

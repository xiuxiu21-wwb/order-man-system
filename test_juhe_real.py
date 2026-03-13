import requests
import json

# 测试聚合数据头条新闻 API
api_key = "52a7e242d00d09e49185ee6e65a078d1"
api_url = "https://v.juhe.cn/toutiao/index"

# 尝试不同的参数组合
test_cases = [
    {"key": api_key, "type": "top"},
    {"key": api_key, "type": "shehui"},
    {"key": api_key, "type": "jiankang"},
]

for i, params in enumerate(test_cases, 1):
    print(f"\n{'='*50}")
    print(f"测试 {i}: {params}")
    print(f"{'='*50}")
    
    try:
        response = requests.get(api_url, params=params, timeout=15)
        print(f"状态码：{response.status_code}")
        
        result = response.json()
        
        if result.get("error_code") == 0 or result.get("reason") == "success":
            print("✅ API 调用成功！")
            print(f"返回数据：{json.dumps(result, indent=2, ensure_ascii=False)[:1000]}")
            
            # 检查数据结构
            if result.get("result"):
                if result["result"].get("list"):
                    print(f"\n找到 {len(result['result']['list'])} 条新闻")
                    for j, news in enumerate(result["result"]["list"][:3], 1):
                        print(f"\n新闻 {j}:")
                        print(f"  标题：{news.get('title', 'N/A')}")
                        print(f"  摘要：{news.get('digest', 'N/A')[:50] if news.get('digest') else 'N/A'}...")
                        print(f"  时间：{news.get('mtime', 'N/A')}")
                        print(f"  图片：{news.get('thumbnail_str', 'N/A')[:100] if news.get('thumbnail_str') else 'N/A'}...")
                elif result["result"].get("data"):
                    print(f"\n找到 {len(result['result']['data'])} 条新闻 (data 格式)")
            break
        else:
            print(f"❌ API 调用失败：")
            print(f"  错误原因：{result.get('reason', 'N/A')}")
            print(f"  错误码：{result.get('error_code', 'N/A')}")
            print(f"  结果码：{result.get('resultcode', 'N/A')}")
            
    except Exception as e:
        print(f"❌ 异常：{e}")

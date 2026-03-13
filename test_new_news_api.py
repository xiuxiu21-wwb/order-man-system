import requests
import json

# 测试新的聚合数据新闻 API
api_key = "2494fe7d7758addc709b1775074827be"
api_url = "https://v.juhe.cn/toutiao/index"

print(f"测试新的新闻 API key: {api_key}")
print("="*60)

params = {
    "key": api_key,
    "type": "top"
}

try:
    response = requests.get(api_url, params=params, timeout=15)
    print(f"状态码：{response.status_code}")
    
    result = response.json()
    print(f"\n完整响应:")
    print(json.dumps(result, indent=2, ensure_ascii=False)[:2000])
    
    if result.get("error_code") == 0 or result.get("reason") == "success":
        print("\n✅ API 调用成功！")
        
        # 检查数据结构
        if result.get("result"):
            news_list = result["result"].get("list") or result["result"].get("data")
            
            if news_list:
                print(f"\n找到 {len(news_list)} 条新闻")
                
                for i, news in enumerate(news_list[:5], 1):
                    print(f"\n新闻 {i}:")
                    print(f"  标题：{news.get('title', 'N/A')}")
                    print(f"  摘要：{news.get('digest', 'N/A')[:50] if news.get('digest') else 'N/A'}...")
                    print(f"  来源：{news.get('author_name', 'N/A')}")
                    print(f"  时间：{news.get('mtime', 'N/A')}")
                    print(f"  图片：{news.get('thumbnail_str', 'N/A')[:100] if news.get('thumbnail_str') else 'N/A'}...")
            else:
                print("没有找到新闻数据")
        else:
            print("result 字段为空")
    else:
        print(f"\n❌ API 调用失败：")
        print(f"  错误原因：{result.get('reason', 'N/A')}")
        print(f"  错误码：{result.get('error_code', 'N/A')}")
        print(f"  结果码：{result.get('resultcode', 'N/A')}")
        
except Exception as e:
    print(f"❌ 异常：{e}")
    import traceback
    traceback.print_exc()

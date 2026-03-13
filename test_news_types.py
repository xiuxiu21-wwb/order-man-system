import requests
import json

# 测试新闻 API 的不同分类
api_key = "2494fe7d7758addc709b1775074827be"
api_url = "https://v.juhe.cn/toutiao/index"

# 测试不同的新闻类型
news_types = [
    ("top", "头条"),
    ("shehui", "社会"),
    ("jiankang", "健康"),
    ("tiyu", "体育"),
    ("junshi", "军事"),
    ("guonei", "国内"),
]

for type_code, type_name in news_types:
    print(f"\n{'='*60}")
    print(f"测试 {type_name} ({type_code})")
    print(f"{'='*60}")
    
    params = {
        "key": api_key,
        "type": type_code
    }
    
    try:
        response = requests.get(api_url, params=params, timeout=10)
        result = response.json()
        
        if result.get("reason") == "success!":
            news_list = result["result"].get("data", [])
            print(f"✅ 成功获取 {len(news_list)} 条新闻")
            
            # 显示前 2 条
            for i, news in enumerate(news_list[:2], 1):
                print(f"\n  新闻 {i}:")
                print(f"    标题：{news.get('title', 'N/A')[:40]}...")
                print(f"    来源：{news.get('author_name', 'N/A')}")
                print(f"    时间：{news.get('date', 'N/A')}")
        else:
            print(f"❌ 失败：{result.get('reason', 'N/A')}")
            
    except Exception as e:
        print(f"❌ 异常：{e}")

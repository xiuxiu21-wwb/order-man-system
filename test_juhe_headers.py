import requests
import json

# 测试聚合数据头条新闻 API
api_key = "52a7e242d00d09e49185ee6e65a078d1"
api_url = "https://v.juhe.cn/toutiao/index"

# 尝试不同的请求方式
print("测试 1: GET 请求，带 Content-Type 头")
print("="*60)

headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json"
}

params = {
    "key": api_key,
    "type": "top"
}

try:
    response = requests.get(api_url, headers=headers, params=params, timeout=15)
    print(f"状态码：{response.status_code}")
    result = response.json()
    print(f"响应：{json.dumps(result, indent=2, ensure_ascii=False)}")
    
    if result.get("error_code") == 0 or result.get("reason") == "success":
        print("\n✅ 成功！")
    else:
        print(f"\n❌ 失败：{result.get('reason')}")
        
except Exception as e:
    print(f"❌ 异常：{e}")

print("\n\n测试 2: POST 请求")
print("="*60)

try:
    response = requests.post(api_url, headers=headers, data=params, timeout=15)
    print(f"状态码：{response.status_code}")
    result = response.json()
    print(f"响应：{json.dumps(result, indent=2, ensure_ascii=False)[:500]}")
    
    if result.get("error_code") == 0 or result.get("reason") == "success":
        print("\n✅ 成功！")
    else:
        print(f"\n❌ 失败：{result.get('reason')}")
        
except Exception as e:
    print(f"❌ 异常：{e}")

print("\n\n测试 3: 直接在 URL 中拼接参数")
print("="*60)

url_with_params = f"{api_url}?key={api_key}&type=top"
print(f"请求 URL: {url_with_params}")

try:
    response = requests.get(url_with_params, timeout=15)
    print(f"状态码：{response.status_code}")
    result = response.json()
    print(f"响应：{json.dumps(result, indent=2, ensure_ascii=False)[:500]}")
    
    if result.get("error_code") == 0 or result.get("reason") == "success":
        print("\n✅ 成功！")
    else:
        print(f"\n❌ 失败：{result.get('reason')}")
        
except Exception as e:
    print(f"❌ 异常：{e}")

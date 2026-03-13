import requests

# 获取 API 文档，查看可用路由
base_url = "http://127.0.0.1:8000"

print("访问 API 文档...")
try:
    response = requests.get(f"{base_url}/openapi.json")
    if response.status_code == 200:
        import json
        data = response.json()
        
        print("\n可用的 medications 相关路由:")
        for path, methods in data.get("paths", {}).items():
            if "medication" in path:
                print(f"\n{path}:")
                for method, details in methods.items():
                    print(f"  - {method.upper()}: {details.get('summary', 'N/A')}")
    else:
        print(f"状态码：{response.status_code}")
except Exception as e:
    print(f"错误：{e}")

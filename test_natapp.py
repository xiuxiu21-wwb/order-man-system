import requests
import json

# 测试 NATAPP 是否能访问
natapp_url = "http://p648734b.natappfree.cc"
local_url = "http://localhost:8082"

print("测试 NATAPP 访问...")
try:
    response = requests.get(natapp_url, timeout=5)
    print(f"NATAPP 响应：{response.status_code}")
    print(f"NATAPP 内容：{response.text[:200]}")
except Exception as e:
    print(f"NATAPP 访问失败：{e}")

print("\n测试本地访问...")
try:
    response = requests.get(local_url, timeout=5)
    print(f"本地响应：{response.status_code}")
    print(f"本地内容：{response.text[:200]}")
except Exception as e:
    print(f"本地访问失败：{e}")

print("\n测试后端 API...")
try:
    response = requests.get("http://localhost:8000/api/test", timeout=5)
    print(f"后端 API 响应：{response.status_code}")
    print(f"后端 API 内容：{response.json()}")
except Exception as e:
    print(f"后端 API 访问失败：{e}")

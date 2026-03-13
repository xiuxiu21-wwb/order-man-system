import requests
import json
from datetime import datetime

# 测试药品管理 API
base_url = "http://127.0.0.1:8000/api"

print("="*60)
print("测试药品管理 API（老人端）")
print("="*60)

# 测试 1: 获取老人的药品列表（假设 elder_id=1）
print("\n1. 测试获取老人药品列表 (elder_id=1)")
try:
    response = requests.get(f"{base_url}/medications/elder/1")
    print(f"状态码：{response.status_code}")
    print(f"响应数据：{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"错误：{e}")

# 测试 2: 添加药品（使用正确的日期格式）
print("\n2. 测试添加药品")
test_medication = {
    "user_id": 1,
    "name": "维生素 C",
    "dosage": "每日 1 片",
    "frequency": "daily",
    "times": "09:00",
    "start_date": "2026-03-11T00:00:00",  # ISO 格式
    "end_date": None
}

try:
    response = requests.post(
        f"{base_url}/medications/elder",
        json=test_medication,
        headers={"Content-Type": "application/json"}
    )
    print(f"状态码：{response.status_code}")
    if response.status_code == 200:
        print(f"响应数据：{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    else:
        print(f"响应内容：{response.text}")
except Exception as e:
    print(f"错误：{e}")
    import traceback
    traceback.print_exc()

# 测试 3: 再次获取药品列表，查看是否添加成功
print("\n3. 再次获取药品列表")
try:
    response = requests.get(f"{base_url}/medications/elder/1")
    print(f"状态码：{response.status_code}")
    medications = response.json()
    if isinstance(medications, list):
        print(f"共有 {len(medications)} 个药品:")
        for med in medications:
            print(f"  - {med.get('name', 'N/A')} (时间：{med.get('times', 'N/A')})")
    else:
        print(f"返回数据：{medications}")
except Exception as e:
    print(f"错误：{e}")

print("\n" + "="*60)
print("测试完成！")
print("="*60)

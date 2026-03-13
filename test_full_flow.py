import requests
import json

base_url = "http://127.0.0.1:8000"

print("="*60)
print("测试药品管理完整流程")
print("="*60)

# 步骤 1: 创建老人用户（如果不存在）
print("\n1. 创建/获取老人用户")
try:
    # 先尝试登录老人账号
    login_data = {
        "uid": "123456",
        "password": "123456"
    }
    response = requests.post(f"{base_url}/api/login", json=login_data)
    if response.status_code == 200:
        elder_user = response.json()
        elder_id = elder_user.get('user', {}).get('id')
        print(f"✅ 老人登录成功，ID: {elder_id}")
    else:
        # 创建老人账号
        register_data = {
            "uid": "123456",
            "password": "123456",
            "name": "测试老人",
            "user_type": "elder"
        }
        response = requests.post(f"{base_url}/api/register", json=register_data)
        if response.status_code == 200:
            elder_user = response.json()
            elder_id = elder_user.get('user', {}).get('id')
            print(f"✅ 老人注册成功，ID: {elder_id}")
        else:
            print(f"❌ 老人注册失败：{response.text}")
            elder_id = 1  # 使用默认 ID
except Exception as e:
    print(f"❌ 错误：{e}")
    elder_id = 1

# 步骤 2: 添加药品
print(f"\n2. 为老人 (ID={elder_id}) 添加药品")
medications_to_add = [
    {
        "user_id": elder_id,
        "name": "降压药",
        "dosage": "早餐后服用 1 片",
        "frequency": "daily",
        "times": "08:00",
        "start_date": "2026-03-11T00:00:00",
        "end_date": None
    },
    {
        "user_id": elder_id,
        "name": "降糖药",
        "dosage": "午餐后服用 1 片",
        "frequency": "daily",
        "times": "12:00",
        "start_date": "2026-03-11T00:00:00",
        "end_date": None
    },
    {
        "user_id": elder_id,
        "name": "阿司匹林",
        "dosage": "晚餐后服用 1 片",
        "frequency": "daily",
        "times": "18:00",
        "start_date": "2026-03-11T00:00:00",
        "end_date": None
    }
]

for med in medications_to_add:
    try:
        response = requests.post(
            f"{base_url}/api/medications/elder",
            json=med,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            print(f"✅ 添加药品成功：{med['name']}")
        else:
            print(f"⚠️  添加失败（可能已存在）: {med['name']}")
    except Exception as e:
        print(f"❌ 错误：{e}")

# 步骤 3: 获取药品列表
print(f"\n3. 获取老人 (ID={elder_id}) 的药品列表")
try:
    response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
    if response.status_code == 200:
        medications = response.json()
        print(f"✅ 获取成功，共 {len(medications)} 个药品:")
        for med in medications:
            print(f"  - {med['name']} ({med['times']}): {med['dosage']}")
    else:
        print(f"❌ 获取失败：{response.text}")
except Exception as e:
    print(f"❌ 错误：{e}")

# 步骤 4: 测试绑定 API
print(f"\n4. 测试绑定 API（获取完整的 elder 信息）")
try:
    # 创建一个测试绑定
    bind_data = {
        "family_id": 2,  # 假设有一个子女 ID 为 2
        "elder_uid": "123456",
        "relation": "父子"
    }
    response = requests.post(
        f"{base_url}/api/bindings/bind",
        json=bind_data,
        headers={"Content-Type": "application/json"}
    )
    print(f"绑定 API 响应：{json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    
    if response.status_code == 200:
        data = response.json().get('data', {})
        print(f"✅ 绑定成功，返回数据包含:")
        print(f"  - elder_id: {data.get('elder_id')}")
        print(f"  - elder_uid: {data.get('elder_uid')}")
        print(f"  - elder_name: {data.get('elder_name')}")
    else:
        print(f"⚠️  绑定失败（可能已绑定）: {response.text}")
except Exception as e:
    print(f"❌ 错误：{e}")

print("\n" + "="*60)
print("测试完成！")
print("="*60)

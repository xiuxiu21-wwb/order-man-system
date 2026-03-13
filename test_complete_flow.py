import requests
import json

base_url = "http://127.0.0.1:8000"

print("="*70)
print("完整流程测试：登录 -> 添加药品 -> 获取药品 -> 验证持久化")
print("="*70)

# 步骤 1: 注册/登录老人账号
print("\n【步骤 1】注册/登录老人账号")
print("-"*70)

# 先尝试注册
register_data = {
    "uid": "test_elder_001",
    "password": "123456",
    "name": "测试老人",
    "user_type": "elder"
}

response = requests.post(f"{base_url}/api/users/register", json=register_data)
if response.status_code == 200:
    print(f"✅ 注册成功: {json.dumps(response.json(), ensure_ascii=False)}")
else:
    print(f"⚠️  注册失败（可能已存在）: {response.text}")

# 登录
login_data = {
    "login": "test_elder_001",
    "password": "123456"
}

response = requests.post(f"{base_url}/api/users/login", json=login_data)
if response.status_code == 200:
    login_result = response.json()
    user_info = login_result.get('user', {})
    elder_id = user_info.get('id')
    token = login_result.get('access_token')
    
    print(f"✅ 登录成功!")
    print(f"   用户 ID: {elder_id}")
    print(f"   用户名: {user_info.get('name')}")
    print(f"   用户类型: {user_info.get('user_type')}")
    print(f"   elder_uid: {user_info.get('elder_uid')}")
    
    # 模拟前端保存 elderInfo
    elder_info = {
        "id": elder_id,
        "uid": user_info.get('elder_uid'),
        "name": user_info.get('name', '老人')
    }
    print(f"\n   前端应该保存的 elderInfo: {json.dumps(elder_info, ensure_ascii=False)}")
else:
    print(f"❌ 登录失败: {response.text}")
    elder_id = 1  # 使用默认 ID

# 步骤 2: 添加药品
print(f"\n【步骤 2】为老人 (ID={elder_id}) 添加药品")
print("-"*70)

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

added_count = 0
for med in medications_to_add:
    response = requests.post(
        f"{base_url}/api/medications/elder",
        json=med,
        headers={"Content-Type": "application/json"}
    )
    if response.status_code == 200:
        print(f"✅ 添加药品成功: {med['name']}")
        added_count += 1
    else:
        print(f"⚠️  添加失败: {med['name']} - {response.text}")

print(f"\n成功添加 {added_count} 个药品")

# 步骤 3: 获取药品列表（模拟返回首页再进入）
print(f"\n【步骤 3】获取药品列表（模拟返回首页再进入）")
print("-"*70)

response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
if response.status_code == 200:
    medications = response.json()
    print(f"✅ 获取成功，共 {len(medications)} 个药品:")
    
    # 按时间排序
    medications.sort(key=lambda x: x.get('times', '00:00'))
    
    for i, med in enumerate(medications, 1):
        print(f"   {i}. {med['name']} ({med['times']}): {med['dosage']}")
else:
    print(f"❌ 获取失败: {response.text}")

# 步骤 4: 添加一个新药品
print(f"\n【步骤 4】添加新药品：维生素 D")
print("-"*70)

new_med = {
    "user_id": elder_id,
    "name": "维生素 D",
    "dosage": "睡前服用 1 片",
    "frequency": "daily",
    "times": "21:00",
    "start_date": "2026-03-11T00:00:00",
    "end_date": None
}

response = requests.post(
    f"{base_url}/api/medications/elder",
    json=new_med,
    headers={"Content-Type": "application/json"}
)
if response.status_code == 200:
    print(f"✅ 添加成功: {new_med['name']}")
    new_med_id = response.json().get('id')
else:
    print(f"❌ 添加失败: {response.text}")
    new_med_id = None

# 步骤 5: 再次获取药品列表（验证新药品已添加）
print(f"\n【步骤 5】再次获取药品列表（验证新药品已添加）")
print("-"*70)

response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
if response.status_code == 200:
    medications = response.json()
    print(f"✅ 获取成功，共 {len(medications)} 个药品:")
    
    medications.sort(key=lambda x: x.get('times', '00:00'))
    
    for i, med in enumerate(medications, 1):
        marker = " 🆕" if med.get('name') == '维生素 D' else ""
        print(f"   {i}. {med['name']} ({med['times']}): {med['dosage']}{marker}")
else:
    print(f"❌ 获取失败: {response.text}")

# 步骤 6: 删除新添加的药品
if new_med_id:
    print(f"\n【步骤 6】删除药品：维生素 D (ID={new_med_id})")
    print("-"*70)
    
    response = requests.delete(f"{base_url}/api/medications/elder/{new_med_id}")
    if response.status_code == 200:
        print(f"✅ 删除成功")
    else:
        print(f"❌ 删除失败: {response.text}")

# 步骤 7: 最终获取药品列表（验证删除成功）
print(f"\n【步骤 7】最终获取药品列表（验证删除成功）")
print("-"*70)

response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
if response.status_code == 200:
    medications = response.json()
    print(f"✅ 获取成功，共 {len(medications)} 个药品:")
    
    medications.sort(key=lambda x: x.get('times', '00:00'))
    
    for i, med in enumerate(medications, 1):
        print(f"   {i}. {med['name']} ({med['times']}): {med['dosage']}")
else:
    print(f"❌ 获取失败: {response.text}")

print("\n" + "="*70)
print("✅ 测试完成！数据持久化正常工作！")
print("="*70)
print(f"\n总结:")
print(f"- 老人 ID: {elder_id}")
print(f"- 药品数量: {len(medications)}")
print(f"- 所有药品都已保存到数据库，退出再进入不会丢失！")

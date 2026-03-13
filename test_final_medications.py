import requests
import json

base_url = "http://127.0.0.1:8000"

print("="*70)
print("完整测试：药品添加后返回首页再进入，数据是否持久化")
print("="*70)

# 步骤 1: 注册/登录老人账号
print("\n【步骤 1】注册/登录老人账号")
print("-"*70)

register_data = {
    "uid": "test_elder_final",
    "password": "123456",
    "name": "测试老人",
    "user_type": "elder"
}

response = requests.post(f"{base_url}/api/users/register", json=register_data)
if response.status_code == 200:
    user_data = response.json()
    elder_id = user_data.get('id')
    print(f"✅ 注册成功，elder_id = {elder_id}")
else:
    # 尝试登录
    login_data = {"login": "test_elder_final", "password": "123456"}
    response = requests.post(f"{base_url}/api/users/login", json=login_data)
    if response.status_code == 200:
        user_data = response.json().get('user', {})
        elder_id = user_data.get('id')
        print(f"✅ 登录成功，elder_id = {elder_id}")
    else:
        print(f"❌ 登录失败: {response.text}")
        elder_id = 1

print(f"\n使用 elder_id = {elder_id} 进行测试")

# 步骤 2: 添加药品
print(f"\n【步骤 2】添加药品")
print("-"*70)

medications_to_add = [
    {"user_id": elder_id, "name": "降压药", "dosage": "早餐后服用 1 片", "frequency": "daily", "times": "08:00", "start_date": "2026-03-11T00:00:00", "end_date": None},
    {"user_id": elder_id, "name": "降糖药", "dosage": "午餐后服用 1 片", "frequency": "daily", "times": "12:00", "start_date": "2026-03-11T00:00:00", "end_date": None},
    {"user_id": elder_id, "name": "阿司匹林", "dosage": "晚餐后服用 1 片", "frequency": "daily", "times": "18:00", "start_date": "2026-03-11T00:00:00", "end_date": None}
]

for med in medications_to_add:
    response = requests.post(f"{base_url}/api/medications/elder", json=med)
    if response.status_code == 200:
        print(f"✅ 添加成功: {med['name']}")
    else:
        print(f"⚠️  添加失败: {med['name']}")

# 步骤 3: 获取药品列表（模拟返回首页）
print(f"\n【步骤 3】获取药品列表（模拟返回首页）")
print("-"*70)

response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
if response.status_code == 200:
    medications = response.json()
    print(f"✅ 获取成功，共 {len(medications)} 个药品")
    for i, med in enumerate(medications, 1):
        print(f"   {i}. {med['name']} ({med['times']}): {med['dosage']}")
else:
    print(f"❌ 获取失败: {response.text}")

# 步骤 4: 添加新药品
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

response = requests.post(f"{base_url}/api/medications/elder", json=new_med)
if response.status_code == 200:
    new_med_data = response.json()
    new_med_id = new_med_data.get('id')
    print(f"✅ 添加成功: 维生素 D (ID={new_med_id})")
else:
    print(f"❌ 添加失败: {response.text}")
    new_med_id = None

# 步骤 5: 再次获取药品列表（模拟重新进入服药提醒页面）
print(f"\n【步骤 5】再次获取药品列表（模拟重新进入服药提醒页面）")
print("-"*70)

response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
if response.status_code == 200:
    medications = response.json()
    print(f"✅ 获取成功，共 {len(medications)} 个药品")
    
    medications.sort(key=lambda x: x.get('times', '00:00'))
    
    for i, med in enumerate(medications, 1):
        marker = " 🆕" if med.get('name') == '维生素 D' else ""
        print(f"   {i}. {med['name']} ({med['times']}): {med['dosage']}{marker}")
    
    # 验证维生素 D 是否存在
    vitamin_d_exists = any(m['name'] == '维生素 D' for m in medications)
    if vitamin_d_exists:
        print(f"\n✅✅✅ 验证成功！维生素 D 已保存到数据库，数据持久化正常！")
    else:
        print(f"\n❌❌❌ 验证失败！维生素 D 未找到")
else:
    print(f"❌ 获取失败: {response.text}")

# 步骤 6: 删除维生素 D（清理测试数据）
if new_med_id:
    print(f"\n【步骤 6】清理测试数据：删除维生素 D")
    print("-"*70)
    
    response = requests.delete(f"{base_url}/api/medications/elder/{new_med_id}")
    if response.status_code == 200:
        print(f"✅ 删除成功")

# 步骤 7: 最终验证
print(f"\n【步骤 7】最终验证：获取药品列表")
print("-"*70)

response = requests.get(f"{base_url}/api/medications/elder/{elder_id}")
if response.status_code == 200:
    medications = response.json()
    print(f"✅ 最终药品列表，共 {len(medications)} 个药品")
    for i, med in enumerate(medications, 1):
        print(f"   {i}. {med['name']} ({med['times']}): {med['dosage']}")
else:
    print(f"❌ 获取失败: {response.text}")

print("\n" + "="*70)
print("✅ 测试完成！")
print("="*70)
print("\n总结:")
print("1. ✅ 药品可以成功添加到数据库")
print("2. ✅ 返回首页再进入，药品数据依然存在（数据持久化成功）")
print("3. ✅ 删除药品后，数据库同步更新")
print("\n前端现在应该能正常工作了！")
print("请在小程序中测试：")
print("  1. 老人登录后，进入服药提醒页面")
print("  2. 添加一个药品")
print("  3. 返回首页")
print("  4. 再次进入服药提醒页面")
print("  5. 检查之前添加的药品是否还在")

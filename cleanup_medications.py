import requests

base_url = "http://127.0.0.1:8000"

# 获取所有药品
response = requests.get(f"{base_url}/api/medications/elder/1")
medications = response.json()

print(f"当前共有 {len(medications)} 个药品:")
for med in medications:
    print(f"  ID:{med['id']} - {med['name']} ({med['times']}): {med['dosage']}")

# 删除重复的维生素 C
print("\n删除重复的药品...")
for med in medications:
    if med['name'] == '维生素 C' and med['id'] in [1, 2]:  # 删除前两个
        response = requests.delete(f"{base_url}/api/medications/elder/{med['id']}")
        if response.status_code == 200:
            print(f"✅ 删除：{med['name']} (ID:{med['id']})")

# 再次获取
response = requests.get(f"{base_url}/api/medications/elder/1")
medications = response.json()
print(f"\n清理后剩余 {len(medications)} 个药品:")
for med in medications:
    print(f"  - {med['name']} ({med['times']}): {med['dosage']}")

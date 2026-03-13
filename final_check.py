import requests

base_url = "http://127.0.0.1:8000"

# 删除维生素 C
response = requests.delete(f"{base_url}/api/medications/elder/6")
if response.status_code == 200:
    print("✅ 已删除维生素 C")

# 获取最终列表
response = requests.get(f"{base_url}/api/medications/elder/1")
medications = response.json()
print(f"\n最终药品列表（共 {len(medications)} 个）:")
for med in medications:
    print(f"  ✅ {med['name']} ({med['times']}): {med['dosage']}")

print("\n✅ 后端数据已准备好，可以开始测试前端了！")

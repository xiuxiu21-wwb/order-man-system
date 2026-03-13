import requests
import json

url = "http://localhost:8000/api/users/register"
data = {
    "name": "测试用户",
    "phone": "13800138001",
    "password": "123456",
    "user_type": "elder"
}

print("发送注册请求...")
print(f"URL: {url}")
print(f"数据: {json.dumps(data, ensure_ascii=False)}")

response = requests.post(url, json=data)

print(f"\n响应状态码: {response.status_code}")
print(f"响应内容: {response.text}")

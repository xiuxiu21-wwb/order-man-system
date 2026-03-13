import requests
import json

# 测试管理员登录
print("🔐 测试管理员登录...")
login_data = {
    "username": "admin",
    "password": "admin123"
}

try:
    response = requests.post("http://localhost:8000/api/admin/login", json=login_data)
    print(f"状态码：{response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ 登录成功！")
        print(f"Token: {result['access_token'][:50]}...")
        
        # 获取用户列表
        print("\n📋 获取用户列表...")
        headers = {"Authorization": f"Bearer {result['access_token']}"}
        users_response = requests.get("http://localhost:8000/api/admin/users", headers=headers)
        
        if users_response.status_code == 200:
            users = users_response.json()
            print(f"✅ 获取成功！共有 {len(users)} 个用户")
            
            # 显示第一个用户的信息
            if users:
                print("\n📊 示例用户信息：")
                print(json.dumps(users[0], indent=2, ensure_ascii=False))
        else:
            print(f"❌ 获取用户列表失败：{users_response.status_code}")
    else:
        print(f"❌ 登录失败：{response.json()}")
        
except Exception as e:
    print(f"❌ 错误：{e}")

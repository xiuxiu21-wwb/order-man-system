from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import get_password_hash

db = SessionLocal()

# 创建管理员账号
admin = User(
    username="admin",
    name="超级管理员",
    phone="88888888",
    password_hash=get_password_hash("admin123"),
    user_type="admin",
    email="admin@system.com"
)

db.add(admin)
db.commit()

print("✅ 管理员账号创建成功！")
print("账号：admin")
print("密码：admin123")
print("请登录管理后台查看用户信息")

db.close()

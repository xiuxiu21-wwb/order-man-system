from app.db.session import SessionLocal
from app.db.models import User
from app.core.security import verify_password

db = SessionLocal()

# 检查 admin 账号
admin = db.query(User).filter(User.username == "admin").first()

if admin:
    print("✅ 管理员账号已存在！")
    print(f"用户名：{admin.username}")
    print(f"用户类型：{admin.user_type}")
    print(f"姓名：{admin.name}")
    print(f"电话：{admin.phone}")
    
    # 验证密码
    if verify_password("admin123", admin.password_hash):
        print("✅ 密码验证成功！")
        print("\n📋 登录信息：")
        print("用户名：admin")
        print("密码：admin123")
    else:
        print("❌ 密码不正确，正在更新密码...")
        from app.core.security import get_password_hash
        admin.password_hash = get_password_hash("admin123")
        db.commit()
        print("✅ 密码已更新为：admin123")
else:
    print("❌ 管理员账号不存在")

db.close()

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.db.models import User

def create_default_users():
    db = SessionLocal()
    try:
        elder_user = db.query(User).filter(User.username == "elder").first()
        if not elder_user:
            db_user = User(
                username="elder",
                password_hash="$2b$12$KQxJZQZQZQZQZQZQZQZQZuWZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ",  
                name="张大爷",
                phone="13800138000",
                user_type="elder"
            )
            db.add(db_user)
            print("✓ 创建老人端账号: elder / 123456")
        
        family_user = db.query(User).filter(User.username == "family").first()
        if not family_user:
            db_user = User(
                username="family",
                password_hash="$2b$12$KQxJZQZQZQZQZQZQZQZQZuWZQZQZQZQZQZQZQZQZQZQZQZQZQZQZQ",
                name="张大爷子女",
                phone="13800138001",
                user_type="family"
            )
            db.add(db_user)
            print("✓ 创建子女端账号: family / 123456")
        
        db.commit()
        print("\n默认用户创建完成！")
        print("老人端账号: elder / 123456")
        print("子女端账号: family / 123456")
    finally:
        db.close()

if __name__ == "__main__":
    create_default_users()

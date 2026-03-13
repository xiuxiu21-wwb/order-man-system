import os
import shutil

db_path = "example_db.db"

if os.path.exists(db_path):
    try:
        os.remove(db_path)
        print(f"已删除旧数据库: {db_path}")
    except Exception as e:
        print(f"删除数据库失败: {e}")
        print("请手动删除文件后再运行初始化脚本")
        exit(1)
else:
    print(f"数据库文件不存在: {db_path}")

print("现在运行初始化脚本...")

from app.db.session import engine, Base
from app.db.models import User, Binding, Location, Medication, MedicationRecord, Reminder, Alert, Conversation, Admin

print("正在创建数据库表结构...")
Base.metadata.create_all(bind=engine)
print("数据库表结构创建完成！")

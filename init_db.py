from app.db.session import engine, Base
from app.db.models import User, Binding, Location, Medication, MedicationRecord, Reminder, Alert, Conversation, Admin

print("正在创建数据库表结构...")
Base.metadata.create_all(bind=engine)
print("数据库表结构创建完成！")

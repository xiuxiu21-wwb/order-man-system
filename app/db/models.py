import uuid
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=True)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(100))
    name = Column(String(50))
    user_type = Column(String(20), index=True)  # elder, family, admin
    elder_uid = Column(String(36), unique=True, index=True, nullable=True)  # 老人专属 UID
    avatar = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    blood_type = Column(String(20), nullable=True)  # 血型
    emergency_contact = Column(String(20), nullable=True)  # 紧急联系电话
    address = Column(String(200), nullable=True)  # 家庭地址
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Binding(Base):
    __tablename__ = "bindings"
    
    id = Column(Integer, primary_key=True, index=True)
    elder_id = Column(Integer, ForeignKey("users.id"), index=True)
    family_id = Column(Integer, ForeignKey("users.id"), index=True)
    status = Column(String(20), default="pending")  # pending, confirmed, rejected, cancelled
    relation = Column(String(50))  # 父子、母子、祖孙等
    request_time = Column(DateTime(timezone=True), server_default=func.now())
    confirm_time = Column(DateTime(timezone=True), nullable=True)
    cancel_time = Column(DateTime(timezone=True), nullable=True)
    
    elder = relationship("User", foreign_keys=[elder_id], backref="bound_families")
    family = relationship("User", foreign_keys=[family_id], backref="bound_elders")

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    accuracy = Column(Float, nullable=True)
    altitude = Column(Float, nullable=True)
    speed = Column(Float, nullable=True)
    address = Column(String(200), nullable=True)
    device_info = Column(String(100), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="locations")

class Medication(Base):
    __tablename__ = "medications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    name = Column(String(100))
    dosage = Column(String(50))
    unit = Column(String(20), default="片")
    frequency = Column(String(50))
    times = Column(String(200))
    instructions = Column(Text, nullable=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="medications")

class MedicationRecord(Base):
    __tablename__ = "medication_records"
    
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    scheduled_time = Column(DateTime)
    actual_time = Column(DateTime, nullable=True)
    status = Column(String(20), default="pending")  # pending, taken, missed, skipped
    confirmed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    medication = relationship("Medication", backref="records")

class Reminder(Base):
    __tablename__ = "reminders"
    
    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id"))
    scheduled_time = Column(DateTime)
    status = Column(String(20))  # pending, sent, confirmed
    
    medication = relationship("Medication", backref="reminders")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    alert_type = Column(String(50), index=True)  # emergency, fall, lost, custom
    message = Column(Text)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_address = Column(String(200), nullable=True)
    status = Column(String(20), default="pending", index=True)  # pending, handling, resolved, cancelled
    handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    handled_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", foreign_keys=[user_id], backref="alerts")
    handler = relationship("User", foreign_keys=[handler_id])

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", backref="conversations")

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(100))
    name = Column(String(50))
    role = Column(String(20), default="admin")  # super_admin, admin, operator
    permissions = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

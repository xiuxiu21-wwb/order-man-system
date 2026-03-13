from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.db.models import Medication, Reminder, User
from app.schemas.medications import MedicationCreate, MedicationResponse, ReminderCreate, ReminderResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/medications", tags=["medications"])

@router.post("/", response_model=MedicationResponse)
def create_medication(medication: MedicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 创建服药计划
    db_medication = Medication(
        user_id=current_user.id,
        name=medication.name,
        dosage=medication.dosage,
        frequency=medication.frequency,
        times=medication.times,
        start_date=medication.start_date,
        end_date=medication.end_date
    )
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    return db_medication

@router.get("/", response_model=List[MedicationResponse])
def get_medications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 获取用户的服药计划
    medications = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    return medications

@router.put("/{medication_id}", response_model=MedicationResponse)
def update_medication(medication_id: int, medication: MedicationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 更新服药计划
    db_medication = db.query(Medication).filter(Medication.id == medication_id, Medication.user_id == current_user.id).first()
    if not db_medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服药计划不存在"
        )
    
    for key, value in medication.dict().items():
        setattr(db_medication, key, value)
    
    db.commit()
    db.refresh(db_medication)
    return db_medication

@router.delete("/{medication_id}")
def delete_medication(medication_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 删除服药计划
    db_medication = db.query(Medication).filter(Medication.id == medication_id, Medication.user_id == current_user.id).first()
    if not db_medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服药计划不存在"
        )
    
    db.delete(db_medication)
    db.commit()
    return {"message": "服药计划已删除"}

@router.post("/reminders", response_model=ReminderResponse)
def create_reminder(reminder: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 创建提醒
    db_reminder = Reminder(
        medication_id=reminder.medication_id,
        scheduled_time=reminder.scheduled_time,
        status="pending"
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.get("/reminders", response_model=List[ReminderResponse])
def get_reminders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 获取用户的提醒
    reminders = db.query(Reminder).join(Medication).filter(Medication.user_id == current_user.id).all()
    return reminders

# 老人端专用接口（不需要登录验证）
@router.get("/elder/{elder_id}", response_model=List[MedicationResponse])
def get_elder_medications(elder_id: int, db: Session = Depends(get_db)):
    # 获取指定老人的药品列表
    medications = db.query(Medication).filter(Medication.user_id == elder_id, Medication.is_active == True).all()
    return medications

@router.post("/elder", response_model=MedicationResponse)
def create_elder_medication(medication: MedicationCreate, db: Session = Depends(get_db)):
    # 为老人添加药品（简化版，不需要登录验证）
    db_medication = Medication(
        user_id=medication.user_id,
        name=medication.name,
        dosage=medication.dosage,
        frequency=medication.frequency,
        times=medication.times,
        start_date=medication.start_date,
        end_date=medication.end_date
    )
    db.add(db_medication)
    db.commit()
    db.refresh(db_medication)
    return db_medication

@router.delete("/elder/{medication_id}")
def delete_elder_medication(medication_id: int, db: Session = Depends(get_db)):
    # 删除老人的药品（简化版，不需要登录验证）
    db_medication = db.query(Medication).filter(Medication.id == medication_id).first()
    if not db_medication:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="服药计划不存在"
        )
    
    db.delete(db_medication)
    db.commit()
    return {"message": "服药计划已删除"}

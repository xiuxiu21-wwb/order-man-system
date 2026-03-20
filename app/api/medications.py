from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import datetime, date, time
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Medication, Reminder, User, MedicationRecord, Binding
from app.schemas.medications import MedicationCreate, MedicationResponse, ReminderCreate, ReminderResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/medications", tags=["medications"])


class MedicationTakeRequest(BaseModel):
    elder_id: int
    medication_id: int
    scheduled_date: str
    scheduled_time: str


def _parse_times(times_text: Optional[str]) -> List[str]:
    if not times_text:
        return []
    return [t.strip() for t in times_text.replace("，", ",").split(",") if t.strip()]


def _build_daily_items(medications: List[Medication], target_date: date, db: Session):
    if not medications:
        return []
    med_ids = [m.id for m in medications]
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)
    records = db.query(MedicationRecord).filter(
        MedicationRecord.medication_id.in_(med_ids),
        MedicationRecord.scheduled_time >= day_start,
        MedicationRecord.scheduled_time <= day_end,
        MedicationRecord.status == "taken"
    ).all()
    record_map = {}
    for record in records:
        time_key = record.scheduled_time.strftime("%H:%M")
        if record.medication_id not in record_map:
            record_map[record.medication_id] = set()
        record_map[record.medication_id].add(time_key)
    result = []
    for med in medications:
        times = _parse_times(med.times)
        if not times:
            times = ["08:00"]
        taken_set = record_map.get(med.id, set())
        today_status = [{"time": t, "taken": t in taken_set} for t in times]
        taken_count = len([s for s in today_status if s["taken"]])
        remaining_count = max(len(times) - taken_count, 0)
        remaining_days = None
        if med.end_date:
            remaining_days = (med.end_date.date() - target_date).days + 1
            if remaining_days < 0:
                remaining_days = 0
        result.append({
            "id": med.id,
            "name": med.name,
            "dosage": med.dosage or med.frequency or "",
            "times": times,
            "todayStatus": today_status,
            "todayRemainingCount": remaining_count,
            "remainingDays": remaining_days,
            "isBackend": True
        })
    return result

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


@router.post("/elder/record")
def mark_elder_medication_taken(payload: MedicationTakeRequest, db: Session = Depends(get_db)):
    medication = db.query(Medication).filter(
        Medication.id == payload.medication_id,
        Medication.user_id == payload.elder_id
    ).first()
    if not medication:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="服药计划不存在")
    try:
        scheduled_dt = datetime.strptime(
            f"{payload.scheduled_date} {payload.scheduled_time}",
            "%Y-%m-%d %H:%M"
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="日期或时间格式错误")
    record = db.query(MedicationRecord).filter(
        MedicationRecord.medication_id == payload.medication_id,
        MedicationRecord.scheduled_time == scheduled_dt
    ).first()
    if record:
        record.status = "taken"
        record.actual_time = datetime.now()
        record.confirmed_by = payload.elder_id
    else:
        record = MedicationRecord(
            medication_id=payload.medication_id,
            scheduled_time=scheduled_dt,
            actual_time=datetime.now(),
            status="taken",
            confirmed_by=payload.elder_id
        )
        db.add(record)
    db.commit()
    return {"success": True}


@router.get("/elder/{elder_id}/daily")
def get_elder_daily_medications(
    elder_id: int,
    date_str: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else datetime.now().date()
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)
    medications = db.query(Medication).filter(
        Medication.user_id == elder_id,
        Medication.is_active == True,
        Medication.start_date <= day_end,
        (Medication.end_date == None) | (Medication.end_date >= day_start)
    ).all()
    data = _build_daily_items(medications, target_date, db)
    return {"success": True, "data": data}


@router.get("/family/{family_id}/daily")
def get_family_daily_medications(
    family_id: int,
    date_str: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else datetime.now().date()
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)
    bindings = db.query(Binding).filter(
        Binding.family_id == family_id,
        Binding.status == "confirmed"
    ).all()
    elder_ids = [b.elder_id for b in bindings]
    if not elder_ids:
        return {"success": True, "data": []}
    elders = db.query(User).filter(User.id.in_(elder_ids)).all()
    elder_name_map = {u.id: u.name for u in elders}
    medications = db.query(Medication).filter(
        Medication.user_id.in_(elder_ids),
        Medication.is_active == True,
        Medication.start_date <= day_end,
        (Medication.end_date == None) | (Medication.end_date >= day_start)
    ).all()
    items = _build_daily_items(medications, target_date, db)
    med_owner = {m.id: m.user_id for m in medications}
    for item in items:
        elder_id = med_owner.get(item["id"])
        item["elderId"] = elder_id
        item["elderName"] = elder_name_map.get(elder_id, "老人")
    return {"success": True, "data": items}
